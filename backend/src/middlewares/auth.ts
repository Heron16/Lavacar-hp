import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, PerfilUsuario } from '../types';

export interface AuthRequest extends Request {
  usuario?: JwtPayload;
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ mensagem: 'Token não fornecido' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ mensagem: 'Token inválido ou expirado' });
  }
}

export function autorizar(...perfis: PerfilUsuario[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      res.status(403).json({ mensagem: 'Acesso negado' });
      return;
    }
    next();
  };
}
