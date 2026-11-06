jest.mock('../../models/UserModel', () => ({
  __esModule: true,
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
  },
}));
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { hash: jest.fn() },
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

import { UserService } from '../../services/UserService';
import { UserModel } from '../../models/UserModel';
import bcrypt from 'bcryptjs';

describe('UserService.criar', () => {
  const service = new UserService();

  beforeEach(() => jest.clearAllMocks());

  it('rejeita e-mail inválido', async () => {
    await expect(service.criar('User', 'invalido', 'Senha@123')).rejects.toThrow('E-mail inválido');
  });

  it('rejeita senha fraca', async () => {
    await expect(service.criar('User', 'user@email.com', '12345678')).rejects.toThrow('Senha fraca');
  });

  it('rejeita e-mail já cadastrado', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue({ id: 'u1' });

    await expect(service.criar('User', 'user@email.com', 'Senha@123')).rejects.toThrow(
      'E-mail já cadastrado',
    );
  });

  it('cria usuário hasheando a senha e retorna dados formatados', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash-gerado');
    (UserModel.create as jest.Mock).mockResolvedValue({
      id: 'u1', nome: 'User', email: 'user@email.com', perfil: 'cliente',
    });

    const resultado = await service.criar('User', 'user@email.com', 'Senha@123');

    expect(bcrypt.hash).toHaveBeenCalledWith('Senha@123', 12);
    expect(UserModel.create).toHaveBeenCalledWith({
      nome: 'User', email: 'user@email.com', senha: 'hash-gerado',
    });
    expect(resultado).toEqual({ id: 'u1', nome: 'User', email: 'user@email.com', perfil: 'cliente' });
  });
});

describe('UserService.atualizar', () => {
  const service = new UserService();

  beforeEach(() => jest.clearAllMocks());

  it('nega permissão se o solicitante for outro usuário', async () => {
    await expect(service.atualizar('u1', 'u2', { nome: 'Novo' })).rejects.toThrow('Sem permissão');
  });

  it('atualiza nome + telefone sem hashear senha', async () => {
    (UserModel.update as jest.Mock).mockResolvedValue([1]);
    (UserModel.findByPk as jest.Mock).mockResolvedValue({
      id: 'u1', nome: 'Novo', email: 'user@email.com', telefone: '1199', perfil: 'cliente',
    });

    const resultado = await service.atualizar('u1', 'u1', { nome: 'Novo', telefone: '1199' });

    expect(UserModel.update).toHaveBeenCalledWith(
      { nome: 'Novo', telefone: '1199' },
      { where: { id: 'u1' } },
    );
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(resultado).toEqual({
      id: 'u1', nome: 'Novo', email: 'user@email.com', telefone: '1199', perfil: 'cliente',
    });
  });

  it('hasheia a nova senha quando informada', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('novo-hash');
    (UserModel.update as jest.Mock).mockResolvedValue([1]);
    (UserModel.findByPk as jest.Mock).mockResolvedValue({
      id: 'u1', nome: 'Novo', email: 'user@email.com', telefone: null, perfil: 'cliente',
    });

    await service.atualizar('u1', 'u1', { nome: 'Novo', senha: 'Senha@123' });

    expect(UserModel.update).toHaveBeenCalledWith(
      { nome: 'Novo', senha: 'novo-hash' },
      { where: { id: 'u1' } },
    );
  });

  it('rejeita senha fraca na atualização', async () => {
    await expect(service.atualizar('u1', 'u1', { nome: 'Novo', senha: '12345678' })).rejects.toThrow(
      'Senha fraca',
    );
  });
});

describe('UserService.buscarPorId', () => {
  const service = new UserService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se não encontrar', async () => {
    (UserModel.findByPk as jest.Mock).mockResolvedValue(null);
    await expect(service.buscarPorId('u1')).rejects.toThrow('Usuário não encontrado');
  });

  it('retorna o usuário quando encontra', async () => {
    (UserModel.findByPk as jest.Mock).mockResolvedValue({ id: 'u1', nome: 'User' });
    expect(await service.buscarPorId('u1')).toEqual({ id: 'u1', nome: 'User' });
  });
});

describe('UserService.excluir', () => {
  const service = new UserService();

  beforeEach(() => jest.clearAllMocks());

  it('lança erro se não encontrar', async () => {
    (UserModel.findByPk as jest.Mock).mockResolvedValue(null);
    await expect(service.excluir('u1')).rejects.toThrow('Usuário não encontrado');
  });

  it('chama destroy() quando encontra', async () => {
    const destroy = jest.fn().mockResolvedValue(undefined);
    (UserModel.findByPk as jest.Mock).mockResolvedValue({ id: 'u1', destroy });

    await service.excluir('u1');

    expect(destroy).toHaveBeenCalled();
  });
});
