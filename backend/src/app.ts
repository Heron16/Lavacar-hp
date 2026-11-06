import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import './models/AppointmentModel';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import vehicleRoutes from './routes/vehicle.routes';
import appointmentRoutes from './routes/appointment.routes';
import uploadRoutes from './routes/upload.routes';
import { UPLOADS_DIR } from './middlewares/upload';
import { loggerMiddleware } from './middlewares/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error(`Origem não permitida: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(loggerMiddleware);
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
