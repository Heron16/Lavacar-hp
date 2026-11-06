import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios' });
        return;
      }
      const resultado = await authService.login(email, senha);
      res.status(200).json(resultado);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao fazer login';
      res.status(401).json({ mensagem });
    }
  }
}
