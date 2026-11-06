import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => Math.min(times * 200, 5000),
  lazyConnect: false,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redis.on('connect', () => console.log('[Redis] Conectado'));
redis.on('error', (err) => console.error('[Redis] Erro:', err.message));
redis.on('close', () => console.warn('[Redis] Conexão encerrada'));

export default redis;
