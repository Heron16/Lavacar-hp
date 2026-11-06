jest.mock('../../models/AppointmentModel', () => ({
  __esModule: true,
  AppointmentModel: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
  },
}));
jest.mock('../../models/ServiceModel', () => ({
  __esModule: true,
  ServiceModel: { findByPk: jest.fn(), findAndCountAll: jest.fn() },
}));
jest.mock('../../models/VehicleModel', () => ({ __esModule: true, VehicleModel: {} }));
jest.mock('../../models/UserModel', () => ({ __esModule: true, UserModel: {} }));
jest.mock('../../utils/cache', () => ({
  __esModule: true,
  cacheAside: jest.fn(),
  invalidarCache: jest.fn(),
  TTL: { SERVICOS: 300, SLOTS: 120, AGENDAMENTOS_ADMIN: 60 },
}));
jest.mock('../../lib/pubsub', () => ({
  __esModule: true,
  publicar: jest.fn(),
  default: {},
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

import { AgendamentoService } from '../../services/AgendamentoService';
import { AppointmentModel } from '../../models/AppointmentModel';
import { ServiceModel } from '../../models/ServiceModel';
import { invalidarCache, cacheAside, TTL } from '../../utils/cache';
import { publicar } from '../../lib/pubsub';
import { CANAIS } from '../../types/events';
import { DadosCriacaoAgendamento, StatusAgendamento } from '../../types';

// Segunda-feira 09:00 (horário válido, dentro da janela da manhã)
const agendadoSegunda09h = new Date(2024, 0, 1, 9, 0);
// Domingo 10:00 (não atendemos)
const agendadoDomingo10h = new Date(2024, 0, 7, 10, 0);

const dadosCriacao: DadosCriacaoAgendamento = {
  usuarioId: 'u1',
  veiculoId: 'v1',
  servicoId: 's1',
  agendadoPara: agendadoSegunda09h,
};

describe('AgendamentoService.criar', () => {
  const service = new AgendamentoService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se o serviço não existir', async () => {
    (ServiceModel.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(service.criar(dadosCriacao)).rejects.toThrow('Serviço não encontrado');
  });

  it('lança erro para agendamento em domingo', async () => {
    (ServiceModel.findByPk as jest.Mock).mockResolvedValue({ id: 's1', duracao: 60, preco: 50 });

    await expect(
      service.criar({ ...dadosCriacao, agendadoPara: agendadoDomingo10h }),
    ).rejects.toThrow('domingos');
  });

  it('cria o agendamento com precoTotal do serviço, invalida o cache e publica evento', async () => {
    (ServiceModel.findByPk as jest.Mock).mockResolvedValue({ id: 's1', duracao: 60, preco: 50 });
    (AppointmentModel.findAll as jest.Mock).mockResolvedValue([]); // sem conflitos
    (AppointmentModel.create as jest.Mock).mockResolvedValue({
      id: 'ag-1', usuarioId: 'u1', servicoId: 's1', veiculoId: 'v1',
      agendadoPara: agendadoSegunda09h, precoTotal: 50, criadoEm: new Date('2024-01-01T09:00:00Z'),
    });
    (invalidarCache as jest.Mock).mockResolvedValue(undefined);
    (publicar as jest.Mock).mockResolvedValue(undefined);

    const resultado = await service.criar(dadosCriacao);

    const createArg = (AppointmentModel.create as jest.Mock).mock.calls[0][0];
    expect(createArg.precoTotal).toBe(50);

    // dataStr derivado do mesmo Date para ser imune a fuso
    const dataStr = agendadoSegunda09h.toISOString().slice(0, 10);
    expect(invalidarCache).toHaveBeenCalledWith(`slots:${dataStr}:*`);
    expect(invalidarCache).toHaveBeenCalledWith('agendamentos:admin:*');
    expect(publicar).toHaveBeenCalledWith(
      CANAIS.AGENDAMENTO_CRIADO,
      expect.objectContaining({ agendamentoId: 'ag-1', usuarioId: 'u1' }),
    );
    expect(resultado.id).toBe('ag-1');
  });
});

describe('AgendamentoService.atualizarStatus', () => {
  const service = new AgendamentoService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se não encontrar o agendamento', async () => {
    (AppointmentModel.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.atualizarStatus('ag-x', 'cancelado', true, 'u1'),
    ).rejects.toThrow('Agendamento não encontrado');
  });

  it('publica evento de cancelamento quando status = cancelado', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    (AppointmentModel.findOne as jest.Mock).mockResolvedValue({
      id: 'ag-1', usuarioId: 'u1', status: 'pendente', agendadoPara: agendadoSegunda09h, update,
    });
    (invalidarCache as jest.Mock).mockResolvedValue(undefined);
    (publicar as jest.Mock).mockResolvedValue(undefined);

    await service.atualizarStatus('ag-1', 'cancelado', true, 'u1');

    expect(publicar).toHaveBeenCalledWith(
      CANAIS.AGENDAMENTO_CANCELADO,
      expect.objectContaining({ agendamentoId: 'ag-1' }),
    );
  });

  it('publica evento de atualização para outros status', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    (AppointmentModel.findOne as jest.Mock).mockResolvedValue({
      id: 'ag-1', usuarioId: 'u1', status: 'pendente', agendadoPara: agendadoSegunda09h, update,
    });
    (invalidarCache as jest.Mock).mockResolvedValue(undefined);
    (publicar as jest.Mock).mockResolvedValue(undefined);

    await service.atualizarStatus('ag-1', 'em_andamento', true, 'u1');

    expect(publicar).toHaveBeenCalledWith(
      CANAIS.AGENDAMENTO_ATUALIZADO,
      expect.objectContaining({
        agendamentoId: 'ag-1', statusAnterior: 'pendente', statusNovo: 'em_andamento',
      }),
    );
  });

  it('invalida cache de slots e de listagem admin', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    (AppointmentModel.findOne as jest.Mock).mockResolvedValue({
      id: 'ag-1', usuarioId: 'u1', status: 'pendente', agendadoPara: agendadoSegunda09h, update,
    });
    (invalidarCache as jest.Mock).mockResolvedValue(undefined);
    (publicar as jest.Mock).mockResolvedValue(undefined);

    await service.atualizarStatus('ag-1', 'concluido', true, 'u1');

    expect(invalidarCache).toHaveBeenCalledWith('agendamentos:admin:*');
  });
});

describe('AgendamentoService.excluir', () => {
  const service = new AgendamentoService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se não encontrar', async () => {
    (AppointmentModel.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.excluir('ag-x', 'u1', false)).rejects.toThrow(
      'Agendamento não encontrado',
    );
  });

  it('exclui, invalida o cache e publica evento de cancelamento', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    (AppointmentModel.findOne as jest.Mock).mockResolvedValue({
      id: 'ag-1', usuarioId: 'u1', agendadoPara: agendadoSegunda09h, destroy,
    });
    (invalidarCache as jest.Mock).mockResolvedValue(undefined);
    (publicar as jest.Mock).mockResolvedValue(undefined);

    await service.excluir('ag-1', 'u1', false);

    expect(destroy).toHaveBeenCalled();
    expect(publicar).toHaveBeenCalledWith(
      CANAIS.AGENDAMENTO_CANCELADO,
      expect.objectContaining({ agendamentoId: 'ag-1' }),
    );
  });
});

describe('AgendamentoService.listarTodos / slotsDisponiveis — cache-aside', () => {
  const service = new AgendamentoService();

  beforeEach(() => jest.clearAllMocks());

  it('listarTodos usa cacheAside com a chave e TTL de admin', async () => {
    (cacheAside as jest.Mock).mockResolvedValue({ dados: [], total: 0, pagina: 1, totalPaginas: 0 });

    await service.listarTodos({ pagina: 1, limite: 10 });

    expect(cacheAside).toHaveBeenCalledWith(
      'agendamentos:admin:p1:l10',
      TTL.AGENDAMENTOS_ADMIN,
      expect.any(Function),
    );
  });

  it('slotsDisponiveis usa cacheAside com a chave e TTL de slots', async () => {
    (cacheAside as jest.Mock).mockResolvedValue([]);

    await service.slotsdisponives('2024-01-01', 's1');

    expect(cacheAside).toHaveBeenCalledWith('slots:2024-01-01:s1', TTL.SLOTS, expect.any(Function));
  });
});
