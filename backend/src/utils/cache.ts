import redis from '../lib/redis';

export const TTL = {
  SERVICOS: 300,
  SLOTS: 120,
  AGENDAMENTOS_ADMIN: 60,
} as const;

export async function cacheAside<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      console.log(`[Cache] HIT  → ${key}`);
      return JSON.parse(cached) as T;
    }
    console.log(`[Cache] MISS → ${key}`);
  } catch (err) {
    console.error(`[Cache] Erro ao ler (${key}):`, (err as Error).message);
  }

  const resultado = await fn();

  try {
    await redis.set(key, JSON.stringify(resultado), 'EX', ttl);
    console.log(`[Cache] SET  → ${key} (TTL: ${ttl}s)`);
  } catch (err) {
    console.error(`[Cache] Erro ao gravar (${key}):`, (err as Error).message);
  }

  return resultado;
}

export async function invalidarCache(pattern: string): Promise<void> {
  try {
    if (!pattern.includes('*')) {
      const deleted = await redis.del(pattern);
      console.log(`[Cache] DEL  → ${pattern} (${deleted} chave(s))`);
      return;
    }

    let cursor = '0';
    let total = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        total += keys.length;
      }
    } while (cursor !== '0');

    console.log(`[Cache] SCAN+DEL → "${pattern}" (${total} chave(s))`);
  } catch (err) {
    console.error(`[Cache] Erro ao invalidar (${pattern}):`, (err as Error).message);
  }
}
