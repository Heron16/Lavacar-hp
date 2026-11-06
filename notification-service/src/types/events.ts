/**
 * DTOs dos eventos consumidos via Redis Pub/Sub.
 * Espelho dos tipos publicados pelo backend — cada serviço
 * mantém sua própria cópia para ser totalmente independente.
 */

export const CANAIS = {
  AGENDAMENTO_CRIADO:    'agendamento:criado',
  AGENDAMENTO_ATUALIZADO:'agendamento:atualizado',
  AGENDAMENTO_CANCELADO: 'agendamento:cancelado',
  SERVICO_CRIADO:        'servico:criado',
  SERVICO_ATUALIZADO:    'servico:atualizado',
} as const;

export type Canal = (typeof CANAIS)[keyof typeof CANAIS];

export interface MensagemEvento<T = unknown> {
  canal: Canal;
  payload: T;
  timestamp: string;
}

export interface EventoAgendamentoCriado {
  agendamentoId: string;
  usuarioId: string;
  servicoId: string;
  veiculoId: string;
  agendadoPara: string;
  precoTotal: number;
  criadoEm: string;
}

export interface EventoAgendamentoAtualizado {
  agendamentoId: string;
  usuarioId: string;
  statusAnterior: string;
  statusNovo: string;
  atualizadoEm: string;
}

export interface EventoAgendamentoCancelado {
  agendamentoId: string;
  usuarioId: string;
  agendadoPara: string;
  canceladoEm: string;
}

export interface EventoServicoCriado {
  servicoId: string;
  nome: string;
  preco: number;
  criadoEm: string;
}

export interface EventoServicoAtualizado {
  servicoId: string;
  campos: string[];
  atualizadoEm: string;
}
