import 'dotenv/config';
import app from './app';
import { sequelize } from './models/database';
import './lib/redis';
import './lib/pubsub';
import { iniciarSubscriber } from './lib/subscriber';

const PORT = process.env.PORT || 3001;

async function iniciar() {
  try {
    await sequelize.sync({ alter: true });
    console.log('[Database] Tabelas sincronizadas');

    iniciarSubscriber();

    app.listen(PORT, () => {
      console.log(`[Server] Porta ${PORT} | ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('[Database] Falha ao iniciar:', err);
    process.exit(1);
  }
}

iniciar();
