import express from 'express';
import cors from 'cors';
import paymentsRouter from './routes/payments';
import { handleStripeWebhook } from './controllers/webhookControllers';
import { setupDocs } from './docs/swagger';

const app = express();

// Orígenes del cliente web permitidos a llamar esta API desde el navegador
// (fetch de package:http en Flutter web) — no aplica a mobile/server-to-server,
// que no pasan por CORS. Todos los orígenes se configuran vía CORS_ORIGINS
// (lista separada por comas, sin espacios extra necesarios) — no hardcodear
// dominios aquí, este repo es público.
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(cors({
  origin: (origin, callback) => {
    // Sin `origin` (curl, server-to-server, apps móviles) → no es una petición
    // de navegador, no aplica CORS.
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use('/payments', paymentsRouter);
app.get('/health', (_req, res) => { res.status(200).json({ status: 'ok' }); });
setupDocs(app);

export default app;
