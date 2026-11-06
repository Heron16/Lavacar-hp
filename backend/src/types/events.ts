/**
 * DTOs (Data Transfer Objects) dos eventos publicados via Redis Pub/Sub.
 *
 * Cada evento tem:
 *  - canal: nome do canal Redis no qual é publicado
 *  - payload: dados trafegados na mensagem
 */

/** Canais Redis disponíveis */
export const CANAIS = {
  AGENDAMENTO_CRIADO:   'agendamento:criado',
  AGENDAMENTO_ATUALIZADO: 'agendamento:atualizado',
  AGENDAMENTO_CANCELADO: 'agendamento:cancelado',
  SERVICO_CRIADO:       'servico:criado',
  SERVICO_ATUALIZADO:   'servico:atualizado',
} as const;

export type Canal = (typeof CANAIS)[keyof typeof CANAIS];

// --- Payloads ---

export interface EventoAgendamentoCriado {
  agendamentoId: string;
  usuarioId: string;
  servicoId: string;
  veiculoId: string;
  agendadoPara: string;   // ISO 8601
  precoTotal: number;
  criadoEm: string;       // ISO 8601
}

export interface EventoAgendamentoAtualizado {
  agendamentoId: string;
  usuarioId: string;
  statusAnterior: string;
  statusNovo: string;
  atualizadoEm: string;   // ISO 8601
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
  campos: string[];        // quais campos foram alterados
  atualizadoEm: string;
}
