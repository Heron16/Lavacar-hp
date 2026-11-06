beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

import { errorHandler, notFoundHandler, AppError } from '../../middlewares/errorHandler';

function mockReq(url = '/api/test'): import('express').Request {
  return { method: 'GET', originalUrl: url } as unknown as import('express').Request;
}

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as import('express').Response;
}

const mockNext = jest.fn();

describe('errorHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna o status HTTP definido para AppError de negócio', () => {
    const res = mockRes();

    errorHandler(new AppError('Não encontrado', 404), mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Não encontrado' });
  });

  it('usa status 400 como padrão para AppError sem status explícito', () => {
    const res = mockRes();

    errorHandler(new AppError('Requisição inválida'), mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retorna 500 e mensagem genérica em produção (sem expor detalhes)', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = mockRes();

    errorHandler(new Error('bug interno'), mockReq(), res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Erro interno do servidor' });

    process.env.NODE_ENV = original;
  });

  it('inclui detalhe e stack em desenvolvimento', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const res = mockRes();

    errorHandler(new Error('bug interno'), mockReq(), res, mockNext);

    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(500);
    expect(body.detalhe).toBe('bug interno');
    expect(body.stack).toBeDefined();

    process.env.NODE_ENV = original;
  });
});

describe('notFoundHandler', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 404 com a rota e o método', () => {
    const res = mockRes();

    notFoundHandler(mockReq('/api/x') as import('express').Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ mensagem: 'Rota GET /api/x não encontrada' });
  });
});
