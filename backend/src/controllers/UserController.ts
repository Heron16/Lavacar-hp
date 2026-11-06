import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../middlewares/auth';
import { DadosAtualizacaoUsuario } from '../types';

const userService = new UserService();

export class UserController {
  async cadastrar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha } = req.body;
      if (!nome || !email || !senha) {
        res.status(400).json({ mensagem: 'Nome, e-mail e senha são obrigatórios' });
        return;
      }
      const usuario = await userService.criar(nome, email, senha);
      res.status(201).json(usuario);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao cadastrar';
      res.status(400).json({ mensagem });
    }
  }

  async atualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nome, senha, telefone } = req.body;
      if (!nome) {
        res.status(400).json({ mensagem: 'Nome é obrigatório' });
        return;
      }
      const dados: DadosAtualizacaoUsuario = { nome, senha, telefone };
      const usuario = await userService.atualizar(id, req.usuario!.usuarioId, dados);
      res.status(200).json(usuario);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao atualizar';
      res.status(400).json({ mensagem });
    }
  }

  async listarTodos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resultado = await userService.listarTodos({
        pagina: Number(req.query.pagina),
        limite: Number(req.query.limite),
      });
      res.status(200).json(resultado);
    } catch {
      res.status(500).json({ mensagem: 'Erro ao buscar usuários' });
    }
  }

  async buscarPorId(req: AuthRequest, res: Response): Promise<void> {
    try {
      const usuario = await userService.buscarPorId(req.params.id);
      res.status(200).json(usuario);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao buscar usuário';
      res.status(404).json({ mensagem });
    }
  }

  async excluir(req: AuthRequest, res: Response): Promise<void> {
    try {
      await userService.excluir(req.params.id);
      res.status(204).send();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao excluir';
      res.status(404).json({ mensagem });
    }
  }
}
