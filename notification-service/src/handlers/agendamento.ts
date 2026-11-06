import { criarLogger } from '../utils/logger';
import {
  EventoAgendamentoCriado,
  EventoAgendamentoAtualizado,
  EventoAgendamentoCancelado,
} from '../types/events';

const log = criarLogger('AgendamentoHandler');

export function handleAgendamentoCriado(payload: EventoAgendamentoCriado): void {
  log.info('📅 Agendamento criado — enviando confirmação', {
    agendamentoId: payload.agendamentoId,
    usuarioId:     payload.usuarioId,
    agendadoPara:  payload.agendadoPara,
    precoTotal:    payload.precoTotal,
  });
  log.info('✉️  [E-mail] Confirmação enviada', {
    usuarioId: payload.usuarioId,
    assunto:   'Seu agendamento foi confirmado!',
  });
}

export function handleAgendamentoAtualizado(payload: EventoAgendamentoAtualizado): void {
  log.info('🔄 Status alterado — notificando usuário', {
    agendamentoId:  payload.agendamentoId,
    de:             payload.statusAnterior,
    para:           payload.statusNovo,
  });

  const mensagens: Record<string, string> = {
    em_andamento: '🚗 Seu veículo está sendo lavado!',
    concluido:    '✅ Seu veículo está pronto!',
  };

  const texto = mensagens[payload.statusNovo];
  if (texto) {
    log.info(`✉️  [E-mail] "${texto}"`, { usuarioId: payload.usuarioId });
  }
}

export function handleAgendamentoCancelado(payload: EventoAgendamentoCancelado): void {
  log.warn('❌ Agendamento cancelado — notificando usuário', {
    agendamentoId: payload.agendamentoId,
    usuarioId:     payload.usuarioId,
    agendadoPara:  payload.agendadoPara,
  });
  log.info('✉️  [E-mail] Notificação de cancelamento enviada', {
    usuarioId: payload.usuarioId,
  });
}
