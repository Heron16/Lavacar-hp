/**
 * Carregado antes de cada suite de testes (setupFiles).
 * Define variáveis de ambiente mínimas para que os módulos que
 * dependem delas (jwt, redis, database) não quebrem na importação.
 */
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://root:root@localhost:3306/carwash_test';
process.env.REDIS_URL = 'redis://localhost:6379';
