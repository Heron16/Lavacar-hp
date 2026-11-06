import { Response } from 'express';
import { VeiculoService } from '../services/VeiculoService';
import { AuthRequest } from '../middlewares/auth';

const veiculoService = new VeiculoService();

export class VeiculoController {
  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { marca, modelo, ano, placa, cor, tipo } = req.body;
      if (!marca || !modelo || !ano || !placa || !cor || !tipo) {
        res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
        return;
      }
      const veiculo = await veiculoService.criar({
        usuarioId: req.usuario!.usuarioId,
        marca, modelo, ano: Number(ano), placa, cor, tipo,
      });
      res.status(201).json(veiculo);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao criar veículo';
      res.status(400).json({ mensagem });
    }
  }

  async listarMeus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resultado = await veiculoService.listarPorUsuario(req.usuario!.usuarioId, {
        pagina: Number(req.query.pagina),
        limite: Number(req.query.limite),
      });
      res.status(200).json(resultado);
    } catch {
      res.status(500).json({ mensagem: 'Erro ao buscar veículos' });
    }
  }

  async listarTodos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resultado = await veiculoService.listarTodos({
        pagina: Number(req.query.pagina),
        limite: Number(req.query.limite),
      });
      res.status(200).json(resultado);
    } catch {
      res.status(500).json({ mensagem: 'Erro ao buscar veículos' });
    }
  }

  async atualizar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const veiculo = await veiculoService.atualizar(
        req.params.id, req.usuario!.usuarioId, req.body
      );
      res.status(200).json(veiculo);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao atualizar';
      res.status(400).json({ mensagem });
    }
  }

  async excluir(req: AuthRequest, res: Response): Promise<void> {
    try {
      const isAdmin = req.usuario!.perfil === 'admin';
      await veiculoService.excluir(req.params.id, req.usuario!.usuarioId, isAdmin);
      res.status(204).send();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao excluir';
      res.status(404).json({ mensagem });
    }
  }
}
