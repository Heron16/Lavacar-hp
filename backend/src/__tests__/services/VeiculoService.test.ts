jest.mock('../../models/VehicleModel', () => ({
  __esModule: true,
  VehicleModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

import { VeiculoService } from '../../services/VeiculoService';
import { VehicleModel } from '../../models/VehicleModel';
import { DadosCriacaoVeiculo } from '../../types';

const dadosValidos: DadosCriacaoVeiculo = {
  usuarioId: 'u1',
  marca: 'Honda',
  modelo: 'Civic',
  ano: 2020,
  placa: 'ABC1D23',
  cor: 'preto',
  tipo: 'carro',
};

describe('VeiculoService.criar', () => {
  const service = new VeiculoService();

  beforeEach(() => jest.clearAllMocks());

  it('rejeita quando faltar campo obrigatório', async () => {
    await expect(
      service.criar({ ...dadosValidos, marca: '' }),
    ).rejects.toThrow('Todos os campos são obrigatórios');
  });

  it('rejeita placa duplicada', async () => {
    (VehicleModel.findOne as jest.Mock).mockResolvedValue({ id: 'v1' });

    await expect(service.criar(dadosValidos)).rejects.toThrow('Placa já cadastrada');
  });

  it('normaliza a placa para maiúsculas ao criar e ao verificar duplicidade', async () => {
    (VehicleModel.findOne as jest.Mock).mockResolvedValue(null);
    (VehicleModel.create as jest.Mock).mockResolvedValue({ id: 'v1' });

    await service.criar({ ...dadosValidos, placa: 'abc1d23' });

    expect(VehicleModel.findOne).toHaveBeenCalledWith({ where: { placa: 'ABC1D23' } });
    expect(VehicleModel.create).toHaveBeenCalledWith({ ...dadosValidos, placa: 'ABC1D23' });
  });
});

describe('VeiculoService.atualizar', () => {
  const service = new VeiculoService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se o veículo não pertencer ao usuário', async () => {
    (VehicleModel.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.atualizar('v1', 'u1', { cor: 'azul' })).rejects.toThrow(
      'Veículo não encontrado ou sem permissão',
    );
  });

  it('atualiza e retorna o veículo', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const veiculo = { id: 'v1', update };
    (VehicleModel.findOne as jest.Mock).mockResolvedValue(veiculo);

    const resultado = await service.atualizar('v1', 'u1', { cor: 'azul' });

    expect(update).toHaveBeenCalledWith({ cor: 'azul' });
    expect(resultado).toBe(veiculo);
  });
});

describe('VeiculoService.excluir', () => {
  const service = new VeiculoService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se não encontrar (não admin)', async () => {
    (VehicleModel.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.excluir('v1', 'u1', false)).rejects.toThrow(
      'Veículo não encontrado ou sem permissão',
    );
  });

  it('usa condição de admin (somente id) quando isAdmin=true', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    (VehicleModel.findOne as jest.Mock).mockResolvedValue({ id: 'v1', destroy });

    await service.excluir('v1', 'u2', true);

    expect(VehicleModel.findOne).toHaveBeenCalledWith({ where: { id: 'v1' } });
    expect(destroy).toHaveBeenCalled();
  });

  it('usa condição de dono (id + usuarioId) quando isAdmin=false', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    (VehicleModel.findOne as jest.Mock).mockResolvedValue({ id: 'v1', destroy });

    await service.excluir('v1', 'u1', false);

    expect(VehicleModel.findOne).toHaveBeenCalledWith({ where: { id: 'v1', usuarioId: 'u1' } });
    expect(destroy).toHaveBeenCalled();
  });
});
