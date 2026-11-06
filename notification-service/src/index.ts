import 'dotenv/config';
import { iniciarSubscriber } from './subscriber';
import { criarLogger } from './utils/logger';

const log = criarLogger('NotificationService');

log.info('AquaWash — Notification Service iniciando...');
log.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
log.info(`Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);

iniciarSubscriber();

process.on('SIGTERM', () => { log.info('SIGTERM — encerrando'); process.exit(0); });
process.on('SIGINT',  () => { log.info('SIGINT — encerrando');  process.exit(0); });
process.on('uncaughtException', (err) => {
  log.error('Exceção não capturada', { erro: err.message, stack: err.stack });
  process.exit(1);
});
