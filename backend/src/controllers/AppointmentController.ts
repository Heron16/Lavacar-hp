import { Response } from 'express';
import { AgendamentoService } from '../services/AgendamentoService';
import { AuthRequest } from '../middlewares/auth';
import { StatusAgendamento } from '../types';

const agendamentoService = new AgendamentoService();

export class AgendamentoController {
  async slotsDisponiveis(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { data, servicoId } = req.query;
      if (!data || !servicoId) {
        res.status(400).json({ mensagem: 'data e servicoId são obrigatórios' });
        return;
      }
      const slots = await agendamentoService.slotsdisponives(String(data), String(servicoId));
      res.status(200).json({ slots });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao buscar slots';
      res.status(400).json({ mensagem });
    }
  }

  async criar(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { veiculoId, servicoId, agendadoPara, observacoes } = req.body;
      if (!veiculoId || !servicoId || !agendadoPara) {
        res.status(400).json({ mensagem: 'Veículo, serviço e data são obrigatórios' });
        return;
      }
      const agendamento = await agendamentoService.criar({
        usuarioId: req.usuario!.usuarioId,
        veiculoId,
        servicoId,
        agendadoPara: new Date(agendadoPara),
        observacoes,
      });
      res.status(201).json(agendamento);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao criar agendamento';
      res.status(400).json({ mensagem });
    }
  }

  async listarMeus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resultado = await agendamentoService.listarPorUsuario(req.usuario!.usuarioId, {
        pagina: Number(req.query.pagina),
        limite: Number(req.query.limite),
      });
      res.status(200).json(resultado);
    } catch {
      res.status(500).json({ mensagem: 'Erro ao buscar agendamentos' });
    }
  }

  async listarTodos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const resultado = await agendamentoService.listarTodos({
        pagina: Number(req.query.pagina),
        limite: Number(req.query.limite),
      });
      res.status(200).json(resultado);
    } catch {
      res.status(500).json({ mensagem: 'Erro ao buscar agendamentos' });
    }
  }

  async atualizarStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ mensagem: 'Status é obrigatório' });
        return;
      }
      const isAdmin = req.usuario!.perfil === 'admin';
      const agendamento = await agendamentoService.atualizarStatus(
        req.params.id,
        status as StatusAgendamento,
        isAdmin,
        req.usuario!.usuarioId,
      );
      res.status(200).json(agendamento);
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao atualizar status';
      res.status(400).json({ mensagem });
    }
  }

  async excluir(req: AuthRequest, res: Response): Promise<void> {
    try {
      const isAdmin = req.usuario!.perfil === 'admin';
      await agendamentoService.excluir(req.params.id, req.usuario!.usuarioId, isAdmin);
      res.status(204).send();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro ao excluir';
      res.status(404).json({ mensagem });
    }
  }
}
