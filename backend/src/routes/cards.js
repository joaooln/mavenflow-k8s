import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireBoardMember } from '../middleware/auth.js';
import { broadcastBoardUpdate, pushNotification } from '../websocket/index.js';

const router = Router({ mergeParams: true });
router.use(authenticate, requireBoardMember);

async function logActivity(cardId, boardId, userId, text) {
  await query(
    'INSERT INTO activity (card_id, board_id, user_id, text) VALUES ($1, $2, $3, $4)',
    [cardId, boardId, userId, text]
  );
}

// POST /api/boards/:boardId/columns/:columnId/cards
router.post('/:columnId/cards', async (req, res) => {
  const { title, description, category, status, priority, dueDate, labelIds, memberIds } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Título obrigatório' });

  const posRes = await query(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM cards WHERE column_id = $1',
    [req.params.columnId]
  );

  const { rows } = await query(
    `INSERT INTO cards (column_id, title, description, category, status, priority, due_date, position, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [req.params.columnId, title.trim(), description || '', category || 'Geral',
     status || 'Todo', priority || 'Medium', dueDate || null, posRes.rows[0].next, req.userId]
  );
  const card = rows[0];

  if (labelIds?.length) {
    for (const lid of labelIds) {
      await query('INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [card.id, lid]);
    }
  }
  if (memberIds?.length) {
    for (const uid of memberIds) {
      await query('INSERT INTO card_members (card_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [card.id, uid]);
    }
  }

  await logActivity(card.id, req.params.boardId, req.userId, 'criou este card');
  broadcastBoardUpdate(req.params.boardId);
  res.status(201).json({ id: card.id });
});

// PUT /api/boards/:boardId/cards/:id
router.put('/:id', async (req, res) => {
  const { title, description, category, status, priority, dueDate, progress, labelIds, memberIds } = req.body;
  const cardId = req.params.id;

  // Fetch current card to diff members/labels
  const cur = await query('SELECT * FROM cards WHERE id=$1', [cardId]);
  if (!cur.rows.length) return res.status(404).json({ error: 'Card não encontrado' });

  await query(
    `UPDATE cards SET
       title=COALESCE($1,title), description=COALESCE($2,description),
       category=COALESCE($3,category), status=COALESCE($4,status),
       priority=COALESCE($5,priority), due_date=COALESCE($6,due_date),
       progress=COALESCE($7,progress), updated_at=NOW()
     WHERE id=$8`,
    [title?.trim(), description, category, status, priority, dueDate || null, progress, cardId]
  );

  // Sync labels
  if (labelIds !== undefined) {
    await query('DELETE FROM card_labels WHERE card_id=$1', [cardId]);
    for (const lid of labelIds) {
      await query('INSERT INTO card_labels (card_id, label_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [cardId, lid]);
    }
  }

  // Sync members — notify newly added ones
  if (memberIds !== undefined) {
    const prevRes = await query('SELECT user_id FROM card_members WHERE card_id=$1', [cardId]);
    const prev = new Set(prevRes.rows.map(r => r.user_id));
    await query('DELETE FROM card_members WHERE card_id=$1', [cardId]);

    const cardTitleRes = await query('SELECT title FROM cards WHERE id=$1', [cardId]);
    const cardTitle = cardTitleRes.rows[0]?.title;

    for (const uid of memberIds) {
      await query('INSERT INTO card_members (card_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [cardId, uid]);
      if (!prev.has(uid) && uid !== req.userId) {
        const notif = await query(
          `INSERT INTO notifications (user_id, type, title, body, board_id, card_id)
           VALUES ($1,'card_assigned',$2,$3,$4,$5) RETURNING *`,
          [uid, 'Você foi atribuído a um card', `Card: "${cardTitle}"`, req.params.boardId, cardId]
        );
        pushNotification(uid, notif.rows[0]);
      }
    }
  }

  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

// POST /api/boards/:boardId/cards/:id/archive
router.post('/:id/archive', async (req, res) => {
  const { rows } = await query('SELECT archived FROM cards WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Card não encontrado' });
  const newState = !rows[0].archived;
  await query('UPDATE cards SET archived=$1, updated_at=NOW() WHERE id=$2', [newState, req.params.id]);
  await logActivity(req.params.id, req.params.boardId, req.userId, newState ? 'arquivou este card' : 'restaurou este card');
  broadcastBoardUpdate(req.params.boardId);
  res.json({ archived: newState });
});

// POST /api/boards/:boardId/cards/:id/move — { columnId, position }
router.post('/:id/move', async (req, res) => {
  const { columnId, position } = req.body;
  // Shift cards in destination column
  await query(
    'UPDATE cards SET position=position+1 WHERE column_id=$1 AND position>=$2 AND id!=$3',
    [columnId, position, req.params.id]
  );
  await query(
    'UPDATE cards SET column_id=$1, position=$2, updated_at=NOW() WHERE id=$3',
    [columnId, position, req.params.id]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

// POST /api/boards/:boardId/columns/:columnId/cards/reorder — { order: [{id, position}] }
router.post('/:columnId/cards/reorder', async (req, res) => {
  const { order } = req.body;
  for (const { id, position } of order) {
    await query('UPDATE cards SET position=$1 WHERE id=$2', [position, id]);
  }
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

// DELETE /api/boards/:boardId/cards/:id
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM cards WHERE id=$1', [req.params.id]);
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

export default router;
