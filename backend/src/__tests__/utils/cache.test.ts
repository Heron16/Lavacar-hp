jest.mock('../../lib/redis', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scan: jest.fn(),
  },
}));

// Silencia os logs do próprio cache (HIT/MISS/SET/DEL...) durante os testes
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

import redis from '../../lib/redis';
import { cacheAside, invalidarCache, TTL } from '../../utils/cache';

const redisGet = redis.get as jest.Mock;
const redisSet = redis.set as jest.Mock;
const redisDel = redis.del as jest.Mock;
const redisScan = redis.scan as jest.Mock;

describe('cacheAside — padrão cache-aside', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna do cache em HIT sem chamar o banco', async () => {
    redisGet.mockResolvedValue(JSON.stringify({ ok: true }));
    const fn = jest.fn();

    const resultado = await cacheAside('chave', 60, fn);

    expect(redisGet).toHaveBeenCalledWith('chave');
    expect(fn).not.toHaveBeenCalled();
    expect(redisSet).not.toHaveBeenCalled();
    expect(resultado).toEqual({ ok: true });
  });

  it('busca no banco e grava no cache com TTL em caso de MISS', async () => {
    redisGet.mockResolvedValue(null);
    redisSet.mockResolvedValue('OK');
    const fn = jest.fn().mockResolvedValue({ item: 1 });

    const resultado = await cacheAside('chave', 60, fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith('chave', JSON.stringify({ item: 1 }), 'EX', 60);
    expect(resultado).toEqual({ item: 1 });
  });

  it('continua funcionando (graceful degradation) se o Redis falhar ao ler', async () => {
    redisGet.mockRejectedValue(new Error('conexao perdida'));
    redisSet.mockResolvedValue('OK');
    const fn = jest.fn().mockResolvedValue('valor-banco');

    const resultado = await cacheAside('chave', 60, fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(resultado).toBe('valor-banco');
  });

  it('retorna o resultado mesmo se o Redis falhar ao gravar', async () => {
    redisGet.mockResolvedValue(null);
    redisSet.mockRejectedValue(new Error('sem escrita'));
    const fn = jest.fn().mockResolvedValue('valor-banco');

    const resultado = await cacheAside('chave', 60, fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(resultado).toBe('valor-banco');
  });
});

describe('invalidarCache', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deleta chave exata com DEL direto (sem SCAN)', async () => {
    redisDel.mockResolvedValue(1);

    await invalidarCache('servicos:listar:p1:l10');

    expect(redisDel).toHaveBeenCalledWith('servicos:listar:p1:l10');
    expect(redisScan).not.toHaveBeenCalled();
  });

  it('usa SCAN + DEL para padrões glob', async () => {
    redisScan
      .mockResolvedValueOnce(['1', ['servicos:a', 'servicos:b']])
      .mockResolvedValueOnce(['0', ['servicos:c']]);
    redisDel.mockResolvedValue(2);

    await invalidarCache('servicos:*');

    expect(redisScan).toHaveBeenCalledTimes(2);
    // Primeiro lote
    expect(redisDel).toHaveBeenNthCalledWith(1, 'servicos:a', 'servicos:b');
    // Segundo lote
    expect(redisDel).toHaveBeenNthCalledWith(2, 'servicos:c');
  });

  it('lida com erro sem lançar exceção (graceful degradation)', async () => {
    redisDel.mockRejectedValue(new Error('falha redis'));

    await expect(invalidarCache('chave')).resolves.not.toThrow();
  });
});

describe('TTL', () => {
  it('expõe os TTLs esperados (em segundos)', () => {
    expect(TTL.SERVICOS).toBe(300);
    expect(TTL.SLOTS).toBe(120);
    expect(TTL.AGENDAMENTOS_ADMIN).toBe(60);
  });
});
