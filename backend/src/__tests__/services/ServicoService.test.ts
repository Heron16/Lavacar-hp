jest.mock('../../models/ServiceModel', () => ({
  __esModule: true,
  ServiceModel: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));
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

import { ServicoService } from '../../services/ServicoService';
import { ServiceModel } from '../../models/ServiceModel';
import { cacheAside, invalidarCache, TTL } from '../../utils/cache';
import { publicar } from '../../lib/pubsub';
import { CANAIS } from '../../types/events';
import { TipoVeiculo } from '../../types';

/** Cria uma instância mock de ServicoModel com toJSON() */
function mockInstancia(over: Record<string, unknown> = {}) {
  const base = {
    id: 'svc-1', nome: 'Lavagem', descricao: 'desc', preco: 50, duracao: 60,
    tiposVeiculo: 'carro,moto', ativo: true, imagemUrl: null,
    criadoEm: new Date('2024-01-01T00:00:00Z'),
    atualizadoEm: new Date('2024-01-01T00:00:00Z'),
    ...over,
  };
  return { ...base, toJSON: () => ({ ...base }) };
}

describe('ServicoService.criar', () => {
  const service = new ServicoService();

  beforeEach(() => jest.clearAllMocks());

  it('rejeita nome vazio', async () => {
    await expect(
      service.criar('', 'desc', 50, 60, ['carro'] as TipoVeiculo[]),
    ).rejects.toThrow('Nome e descrição são obrigatórios');
  });

  it('rejeita preço inválido', async () => {
    await expect(
      service.criar('Lavagem', 'desc', 0, 60, ['carro'] as TipoVeiculo[]),
    ).rejects.toThrow('Preço deve ser maior que zero');
  });

  it('rejeita duração inválida', async () => {
    await expect(
      service.criar('Lavagem', 'desc', 50, 0, ['carro'] as TipoVeiculo[]),
    ).rejects.toThrow('Duração deve ser maior que zero');
  });

  it('cria o serviço com tipos concatenados, invalida o cache e publica evento', async () => {
    const instancia = mockInstancia();
    (ServiceModel.create as jest.Mock).mockResolvedValue(instancia);
    (invalidarCache as jest.Mock).mockResolvedValue(undefined);
    (publicar as jest.Mock).mockResolvedValue(undefined);

    const resultado = await service.criar('Lavagem', 'desc', 50, 60, ['carro', 'moto']);

    expect(ServiceModel.create).toHaveBeenCalledWith({
      nome: 'Lavagem', descricao: 'desc', preco: 50, duracao: 60, tiposVeiculo: 'carro,moto',
    });
    expect(invalidarCache).toHaveBeenCalledWith('servicos:*');
    expect(publicar).toHaveBeenCalledWith(
      CANAIS.SERVICO_CRIADO,
      expect.objectContaining({ servicoId: 'svc-1', nome: 'Lavagem', preco: 50 }),
    );
    expect(resultado.tiposVeiculo).toEqual(['carro', 'moto']);
  });
});

describe('ServicoService.listar / listarAdmin — cache-aside', () => {
  const service = new ServicoService();
  const paginaVazia = { dados: [], total: 0, pagina: 1, totalPaginas: 0 };

  beforeEach(() => jest.clearAllMocks());

  it('listar usa cacheAside com a chave e TTL de serviços', async () => {
    (cacheAside as jest.Mock).mockResolvedValue(paginaVazia);

    await service.listar({ pagina: 1, limite: 10 });

    expect(cacheAside).toHaveBeenCalledWith('servicos:listar:p1:l10', TTL.SERVICOS, expect.any(Function));
  });

  it('listarAdmin usa cacheAside com a chave de admin', async () => {
    (cacheAside as jest.Mock).mockResolvedValue(paginaVazia);

    await service.listarAdmin({ pagina: 2, limite: 5 });

    expect(cacheAside).toHaveBeenCalledWith('servicos:admin:p2:l5', TTL.SERVICOS, expect.any(Function));
  });
});

describe('ServicoService.atualizar', () => {
  const service = new ServicoService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se o serviço não existir', async () => {
    (ServiceModel.findByPk as jest.Mock).mockResolvedValue(null);

    await expect(service.atualizar('svc-x', { nome: 'Novo' })).rejects.toThrow(
      'Serviço não encontrado',
    );
  });

  it('atualiza, invalida o cache e publica evento de atualização', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const instancia = mockInstancia({ update });
    (ServiceModel.findByPk as jest.Mock).mockResolvedValue(instancia);
    (invalidarCache as jest.Mock).mockResolvedValue(undefined);
    (publicar as jest.Mock).mockResolvedValue(undefined);

    await service.atualizar('svc-1', { nome: 'Novo Nome', preco: 60 });

    expect(update).toHaveBeenCalledWith({ nome: 'Novo Nome', preco: 60 });
    expect(invalidarCache).toHaveBeenCalledWith('servicos:*');
    expect(publicar).toHaveBeenCalledWith(
      CANAIS.SERVICO_ATUALIZADO,
      expect.objectContaining({ servicoId: 'svc-1', campos: ['nome', 'preco'] }),
    );
  });
});

describe('ServicoService.excluir', () => {
  const service = new ServicoService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se não existir', async () => {
    (ServiceModel.findByPk as jest.Mock).mockResolvedValue(null);
    await expect(service.excluir('svc-x')).rejects.toThrow('Serviço não encontrado');
  });

  it('exclui e invalida o cache', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    (ServiceModel.findByPk as jest.Mock).mockResolvedValue({ destroy });
    (invalidarCache as jest.Mock).mockResolvedValue(undefined);

    await service.excluir('svc-1');

    expect(destroy).toHaveBeenCalled();
    expect(invalidarCache).toHaveBeenCalledWith('servicos:*');
  });
});
