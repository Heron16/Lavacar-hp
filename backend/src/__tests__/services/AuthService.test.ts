jest.mock('../../models/UserModel', () => ({
  __esModule: true,
  UserModel: { findOne: jest.fn() },
}));
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { compare: jest.fn() },
}));
jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: { sign: jest.fn() },
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

import { AuthService } from '../../services/AuthService';
import { UserModel } from '../../models/UserModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('AuthService.login', () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('lança "E-mail inválido" e não consulta o banco', async () => {
    await expect(service.login('email-invalido', 'Senha@123')).rejects.toThrow('E-mail inválido');
    expect(UserModel.findOne).not.toHaveBeenCalled();
  });

  it('lança "E-mail ou senha incorretos" quando o usuário não existe', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.login('user@email.com', 'Senha@123')).rejects.toThrow(
      'E-mail ou senha incorretos',
    );
  });

  it('lança "E-mail ou senha incorretos" quando a senha não confere', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue({
      id: 'u1', email: 'user@email.com', senha: 'hash', perfil: 'cliente',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login('user@email.com', 'Senha@errada')).rejects.toThrow(
      'E-mail ou senha incorretos',
    );
  });

  it('retorna token + usuário e assina o JWT com o payload correto', async () => {
    (UserModel.findOne as jest.Mock).mockResolvedValue({
      id: 'u1', email: 'user@email.com', senha: 'hash', perfil: 'admin',
      nome: 'Admin', telefone: '1199', fotoPerfil: 'foto.png',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token-gerado');

    const resultado = await service.login('user@email.com', 'Senha@123');

    expect(jwt.sign).toHaveBeenCalledWith(
      { usuarioId: 'u1', perfil: 'admin' },
      'test-secret',
      { expiresIn: '7d' },
    );
    expect(resultado.token).toBe('token-gerado');
    expect(resultado.usuario).toEqual({
      id: 'u1', nome: 'Admin', email: 'user@email.com', perfil: 'admin',
      telefone: '1199', fotoPerfil: 'foto.png',
    });
  });
});
