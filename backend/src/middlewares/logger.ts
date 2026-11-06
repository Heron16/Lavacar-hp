import { Request, Response, NextFunction } from 'express';
import { criarLogger } from '../utils/logger';

const log = criarLogger('HTTP');

export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const inicio = Date.now();
  const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-';

  res.on('finish', () => {
    const ms = Date.now() - inicio;
    const nivel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log[nivel](`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`, { ip: String(ip) });
  });

  next();
}
