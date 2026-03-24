import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT id, type, title, body, board_id, card_id, read, created_at
     FROM notifications WHERE user_id=$1
     ORDER BY created_at DESC LIMIT 50`,
    [req.userId]
  );
  res.json(rows);
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id=$1 AND read=FALSE',
    [req.userId]
  );
  res.json({ count: rows[0].count });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  await query(
    'UPDATE notifications SET read=TRUE WHERE id=$1 AND user_id=$2',
    [req.params.id, req.userId]
  );
  res.json({ ok: true });
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res) => {
  await query('UPDATE notifications SET read=TRUE WHERE user_id=$1', [req.userId]);
  res.json({ ok: true });
});

export default router;
