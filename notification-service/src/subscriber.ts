import Redis from 'ioredis';
import { criarLogger } from './utils/logger';
import { CANAIS, Canal, MensagemEvento } from './types/events';
import { handleAgendamentoCriado, handleAgendamentoAtualizado, handleAgendamentoCancelado } from './handlers/agendamento';
import { handleServicoCriado, handleServicoAtualizado } from './handlers/servico';

const log = criarLogger('Subscriber');
const CANAIS_LISTA = Object.values(CANAIS);

export function iniciarSubscriber(): void {
  const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => {
      const delay = Math.min(times * 300, 5000);
      log.warn(`Reconectando (tentativa #${times}) em ${delay}ms`);
      return delay;
    },
    lazyConnect: false,
    enableOfflineQueue: true,
  });

  subscriber.subscribe(...CANAIS_LISTA, (err, count) => {
    if (err) { log.error('Falha ao assinar canais', { erro: err.message }); return; }
    log.info(`Assinando ${count} canal(is)`, { canais: CANAIS_LISTA });
  });

  subscriber.on('connect',      () => log.info('Conectado ao Redis'));
  subscriber.on('ready',        () => log.info('Aguardando eventos...'));
  subscriber.on('close',        () => log.warn('Conexão encerrada — reconectando...'));
  subscriber.on('reconnecting', () => log.warn('Reconectando ao Redis...'));
  subscriber.on('error', (err) => {
    if (err.message.includes('subscriber mode')) return;
    log.error('Erro Redis', { erro: err.message });
  });

  subscriber.on('message', (canal, raw) => {
    log.info('◀ RECEBIDO', { canal });
    let mensagem: MensagemEvento;
    try {
      mensagem = JSON.parse(raw) as MensagemEvento;
    } catch {
      log.error('Formato inválido', { canal, raw });
      return;
    }
    try {
      rotear(canal as Canal, mensagem.payload);
      log.info('✔ Processado', { canal });
    } catch (err) {
      log.error('✘ Falha ao processar', { canal, erro: (err as Error).message });
    }
  });
}

function rotear(canal: Canal, payload: unknown): void {
  switch (canal) {
    case CANAIS.AGENDAMENTO_CRIADO:    handleAgendamentoCriado(payload as Parameters<typeof handleAgendamentoCriado>[0]); break;
    case CANAIS.AGENDAMENTO_ATUALIZADO: handleAgendamentoAtualizado(payload as Parameters<typeof handleAgendamentoAtualizado>[0]); break;
    case CANAIS.AGENDAMENTO_CANCELADO: handleAgendamentoCancelado(payload as Parameters<typeof handleAgendamentoCancelado>[0]); break;
    case CANAIS.SERVICO_CRIADO:        handleServicoCriado(payload as Parameters<typeof handleServicoCriado>[0]); break;
    case CANAIS.SERVICO_ATUALIZADO:    handleServicoAtualizado(payload as Parameters<typeof handleServicoAtualizado>[0]); break;
    default: log.warn('Canal sem handler', { canal });
  }
}
