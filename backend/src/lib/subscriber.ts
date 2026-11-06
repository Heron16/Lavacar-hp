import Redis from 'ioredis';
import { CANAIS, Canal } from '../types/events';

const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 200, 5000),
  enableOfflineQueue: false,
  lazyConnect: false,
});

subscriber.on('connect', () => console.log('[PubSub:Subscriber] Conectado'));
subscriber.on('error', (err) => console.error('[PubSub:Subscriber] Erro:', err.message));

const handlers: Record<Canal, (payload: unknown) => void> = {
  [CANAIS.AGENDAMENTO_CRIADO]: (p) =>
    console.log('[Evento] 📅 Agendamento criado:', JSON.stringify(p)),
  [CANAIS.AGENDAMENTO_ATUALIZADO]: (p) =>
    console.log('[Evento] 🔄 Agendamento atualizado:', JSON.stringify(p)),
  [CANAIS.AGENDAMENTO_CANCELADO]: (p) =>
    console.log('[Evento] ❌ Agendamento cancelado:', JSON.stringify(p)),
  [CANAIS.SERVICO_CRIADO]: (p) =>
    console.log('[Evento] 🆕 Serviço criado:', JSON.stringify(p)),
  [CANAIS.SERVICO_ATUALIZADO]: (p) =>
    console.log('[Evento] ✏️  Serviço atualizado:', JSON.stringify(p)),
};

export function iniciarSubscriber(): void {
  const canais = Object.values(CANAIS);

  subscriber.subscribe(...canais, (err, count) => {
    if (err) {
      console.error('[PubSub:Subscriber] Falha ao assinar canais:', err.message);
      return;
    }
    console.log(`[PubSub:Subscriber] Assinando ${count} canal(is): ${canais.join(', ')}`);
  });

  subscriber.on('message', (canal, mensagem) => {
    console.log(`[PubSub:Subscriber] RECEIVED ← ${canal}`);
    try {
      const { payload } = JSON.parse(mensagem) as { canal: Canal; payload: unknown; timestamp: string };
      handlers[canal as Canal]?.(payload) ?? console.warn(`[PubSub:Subscriber] Canal sem handler: ${canal}`);
    } catch (err) {
      console.error(`[PubSub:Subscriber] Erro ao processar "${canal}":`, (err as Error).message);
    }
  });
}

export default subscriber;
