import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireBoardMember } from '../middleware/auth.js';
import { broadcastBoardUpdate } from '../websocket/index.js';

const router = Router({ mergeParams: true });
router.use(authenticate, requireBoardMember);

// POST /api/boards/:boardId/cards/:cardId/checklists
router.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Título obrigatório' });
  const posRes = await query('SELECT COALESCE(MAX(position),-1)+1 AS next FROM checklists WHERE card_id=$1', [req.params.cardId]);
  const { rows } = await query(
    'INSERT INTO checklists (card_id, title, position) VALUES ($1,$2,$3) RETURNING *',
    [req.params.cardId, title.trim(), posRes.rows[0].next]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.status(201).json(rows[0]);
});

// PUT /api/boards/:boardId/cards/:cardId/checklists/:id
router.put('/:id', async (req, res) => {
  const { title } = req.body;
  await query('UPDATE checklists SET title=$1 WHERE id=$2 AND card_id=$3', [title.trim(), req.params.id, req.params.cardId]);
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

// DELETE /api/boards/:boardId/cards/:cardId/checklists/:id
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM checklists WHERE id=$1 AND card_id=$2', [req.params.id, req.params.cardId]);
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

// POST .../checklists/:checklistId/items
router.post('/:checklistId/items', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Texto obrigatório' });
  const posRes = await query('SELECT COALESCE(MAX(position),-1)+1 AS next FROM checklist_items WHERE checklist_id=$1', [req.params.checklistId]);
  const { rows } = await query(
    'INSERT INTO checklist_items (checklist_id, text, position) VALUES ($1,$2,$3) RETURNING *',
    [req.params.checklistId, text.trim(), posRes.rows[0].next]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.status(201).json(rows[0]);
});

// PUT .../checklists/:checklistId/items/:itemId
router.put('/:checklistId/items/:itemId', async (req, res) => {
  const { text, checked } = req.body;
  await query(
    'UPDATE checklist_items SET text=COALESCE($1,text), checked=COALESCE($2,checked) WHERE id=$3 AND checklist_id=$4',
    [text?.trim(), checked, req.params.itemId, req.params.checklistId]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

// DELETE .../checklists/:checklistId/items/:itemId
router.delete('/:checklistId/items/:itemId', async (req, res) => {
  await query('DELETE FROM checklist_items WHERE id=$1 AND checklist_id=$2', [req.params.itemId, req.params.checklistId]);
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

export default router;
