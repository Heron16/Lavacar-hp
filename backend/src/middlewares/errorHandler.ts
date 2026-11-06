import { Request, Response, NextFunction } from 'express';
import { criarLogger } from '../utils/logger';

const log = criarLogger('ErrorHandler');

export class AppError extends Error {
  constructor(
    public readonly mensagem: string,
    public readonly statusHttp: number = 400,
  ) {
    super(mensagem);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    log.warn(`Erro de negócio: ${err.mensagem}`, { url: req.originalUrl, status: err.statusHttp });
    res.status(err.statusHttp).json({ mensagem: err.mensagem });
    return;
  }

  log.error(`Erro inesperado: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    mensagem: 'Erro interno do servidor',
    ...(isDev && { detalhe: err.message, stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  log.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ mensagem: `Rota ${req.method} ${req.originalUrl} não encontrada` });
}
