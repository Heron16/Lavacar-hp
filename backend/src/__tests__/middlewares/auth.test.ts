jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: { verify: jest.fn() },
}));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

import jwt from 'jsonwebtoken';
import { autenticar, autorizar, AuthRequest } from '../../middlewares/auth';
import { JwtPayload } from '../../types';

function mockReq(headers: Record<string, string> = {}): AuthRequest {
  return { headers } as unknown as AuthRequest;
}

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as import('express').Response;
}

const mockNext = jest.fn();

describe('autenticar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('retorna 401 "Token não fornecido" quando não há header Authorization', () => {
    const res = mockRes();

    autenticar(mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Token não fornecido' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('define req.usuario e chama next() com token válido', () => {
    const payload: JwtPayload = { usuarioId: 'u1', perfil: 'cliente' };
    (jwt.verify as jest.Mock).mockReturnValue(payload);
    const req = mockReq({ authorization: 'Bearer token-valido' });

    autenticar(req, mockRes(), mockNext);

    expect(jwt.verify).toHaveBeenCalledWith('token-valido', 'test-secret');
    expect(req.usuario).toEqual(payload);
    expect(mockNext).toHaveBeenCalled();
  });

  it('retorna 401 com token inválido', () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt malformed');
    });
    const res = mockRes();

    autenticar(mockReq({ authorization: 'Bearer ruim' }), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Token inválido ou expirado' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('autorizar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('permite acesso quando o perfil está na lista', () => {
    const req = { usuario: { usuarioId: 'u1', perfil: 'admin' } } as unknown as AuthRequest;

    autorizar('admin')(req, mockRes(), mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('nega acesso (403) quando o perfil não está na lista', () => {
    const res = mockRes();
    const req = { usuario: { usuarioId: 'u1', perfil: 'cliente' } } as unknown as AuthRequest;

    autorizar('admin')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Acesso negado' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('nega acesso (403) quando não há usuário autenticado', () => {
    const res = mockRes();
    const req = {} as unknown as AuthRequest;

    autorizar('admin')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
