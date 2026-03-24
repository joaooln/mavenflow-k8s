import 'dotenv/config' assert { type: 'json' };
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initSchema } from './db/index.js';
import { createWebSocketServer } from './websocket/index.js';

import authRoutes         from './routes/auth.js';
import usersRoutes        from './routes/users.js';
import boardsRoutes       from './routes/boards.js';
import columnsRoutes      from './routes/columns.js';
import cardsRoutes        from './routes/cards.js';
import labelsRoutes       from './routes/labels.js';
import checklistsRoutes   from './routes/checklists.js';
import commentsRoutes     from './routes/comments.js';
import notificationsRoutes from './routes/notifications.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/boards',        boardsRoutes);
app.use('/api/boards/:boardId/columns',                       columnsRoutes);
app.use('/api/boards/:boardId/columns/:columnId/cards',       cardsRoutes);
app.use('/api/boards/:boardId/cards',                         cardsRoutes);
app.use('/api/boards/:boardId/labels',                        labelsRoutes);
app.use('/api/boards/:boardId/cards/:cardId/checklists',      checklistsRoutes);
app.use('/api/boards/:boardId/cards/:cardId/comments',        commentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001');
const server = createServer(app);
createWebSocketServer(server);

async function start() {
  try {
    await initSchema();
    server.listen(PORT, () => console.log(`Mavenflow API running on :${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
