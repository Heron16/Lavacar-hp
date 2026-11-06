import { Request, Response } from 'express';
import { ServicoService } from '../services/ServicoService';
import { AuthRequest } from '../middlewares/auth';
import { TipoVeiculo } from '../types';

const servicoService = new ServicoService();

export class ServicoController {
  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { nome, descricao, preco, duracao, tiposVeiculo } = req.body;
      if (!nome || !descricao || !preco || !duracao || !tiposVeiculo) {
        res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
        return;
      }
      const servico = await servicoService.criar(
        nome, descricao, Number(preco), Number(duracao), tiposVeiculo as TipoVeiculo[]
      );
      res.status(201).json(servico);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao criar serviço';
      res.status(400).json({ mensagem });
    }
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const resultado = await servicoService.listar({
        pagina: Number(req.query.pagina),
        limite: Number(req.query.limite),
      });
      res.status(200).json(resultado);
    } catch {
      res.status(500).json({ mensagem: 'Erro ao buscar serviços' });
    }
  }

  async listarAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resultado = await servicoService.listarAdmin({
        pagina: Number(req.query.pagina),
        limite: Number(req.query.limite),
      });
      res.status(200).json(resultado);
    } catch {
      res.status(500).json({ mensagem: 'Erro ao buscar serviços' });
    }
  }

  async atualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const servico = await servicoService.atualizar(req.params.id, req.body);
      res.status(200).json(servico);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao atualizar';
      res.status(400).json({ mensagem });
    }
  }

  async excluir(req: AuthRequest, res: Response): Promise<void> {
    try {
      await servicoService.excluir(req.params.id);
      res.status(204).send();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao excluir';
      res.status(404).json({ mensagem });
    }
  }
}
