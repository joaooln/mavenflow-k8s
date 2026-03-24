import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireBoardMember } from '../middleware/auth.js';
import { broadcastBoardUpdate } from '../websocket/index.js';

const router = Router({ mergeParams: true });
router.use(authenticate, requireBoardMember);

router.get('/', async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, color FROM labels WHERE board_id=$1 ORDER BY created_at',
    [req.params.boardId]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim() || !color) return res.status(400).json({ error: 'Nome e cor obrigatórios' });
  const { rows } = await query(
    'INSERT INTO labels (board_id, name, color) VALUES ($1,$2,$3) RETURNING *',
    [req.params.boardId, name.trim(), color]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, color } = req.body;
  await query(
    'UPDATE labels SET name=COALESCE($1,name), color=COALESCE($2,color) WHERE id=$3 AND board_id=$4',
    [name?.trim(), color, req.params.id, req.params.boardId]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM labels WHERE id=$1 AND board_id=$2', [req.params.id, req.params.boardId]);
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

export default router;
