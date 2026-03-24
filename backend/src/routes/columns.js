import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireBoardMember } from '../middleware/auth.js';
import { broadcastBoardUpdate } from '../websocket/index.js';

const router = Router({ mergeParams: true });
router.use(authenticate, requireBoardMember);

// POST /api/boards/:boardId/columns
router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Título obrigatório' });

  const posRes = await query(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM columns WHERE board_id = $1',
    [req.params.boardId]
  );
  const { rows } = await query(
    'INSERT INTO columns (board_id, title, position) VALUES ($1, $2, $3) RETURNING *',
    [req.params.boardId, title.trim().toUpperCase(), posRes.rows[0].next]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.status(201).json(rows[0]);
});

// PUT /api/boards/:boardId/columns/:id
router.put('/:id', async (req, res) => {
  const { title } = req.body;
  await query(
    'UPDATE columns SET title=$1 WHERE id=$2 AND board_id=$3',
    [title.trim().toUpperCase(), req.params.id, req.params.boardId]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

// DELETE /api/boards/:boardId/columns/:id
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM columns WHERE id=$1 AND board_id=$2', [req.params.id, req.params.boardId]);
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

// POST /api/boards/:boardId/columns/reorder — body: [{ id, position }]
router.post('/reorder', async (req, res) => {
  const { order } = req.body; // [{ id, position }]
  for (const { id, position } of order) {
    await query('UPDATE columns SET position=$1 WHERE id=$2 AND board_id=$3', [position, id, req.params.boardId]);
  }
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

export default router;
