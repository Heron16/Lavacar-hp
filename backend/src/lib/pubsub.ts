import Redis from 'ioredis';
import { Canal } from '../types/events';

const publisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 200, 5000),
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  lazyConnect: false,
});

publisher.on('connect', () => console.log('[PubSub:Publisher] Conectado'));
publisher.on('error', (err) => console.error('[PubSub:Publisher] Erro:', err.message));

export async function publicar<T extends object>(canal: Canal, payload: T): Promise<void> {
  const mensagem = JSON.stringify({ canal, payload, timestamp: new Date().toISOString() });
  try {
    const qtd = await publisher.publish(canal, mensagem);
    console.log(`[PubSub:Publisher] PUBLISH → ${canal} | ${qtd} subscriber(s)`);
  } catch (err) {
    console.error(`[PubSub:Publisher] Falha em "${canal}":`, (err as Error).message);
  }
}

export default publisher;
