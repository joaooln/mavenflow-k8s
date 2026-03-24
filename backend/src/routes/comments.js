import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate, requireBoardMember } from '../middleware/auth.js';
import { broadcastBoardUpdate, pushNotification } from '../websocket/index.js';

const router = Router({ mergeParams: true });
router.use(authenticate, requireBoardMember);

// POST /api/boards/:boardId/cards/:cardId/comments
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Texto obrigatório' });

  const { rows } = await query(
    'INSERT INTO comments (card_id, user_id, text) VALUES ($1,$2,$3) RETURNING *',
    [req.params.cardId, req.userId, text.trim()]
  );

  // Notify all card members (except the commenter)
  const cardRes = await query('SELECT title FROM cards WHERE id=$1', [req.params.cardId]);
  const cardTitle = cardRes.rows[0]?.title;
  const authorRes = await query('SELECT name FROM users WHERE id=$1', [req.userId]);
  const authorName = authorRes.rows[0]?.name || 'Alguém';

  const membersRes = await query(
    'SELECT user_id FROM card_members WHERE card_id=$1 AND user_id!=$2',
    [req.params.cardId, req.userId]
  );
  for (const { user_id } of membersRes.rows) {
    const notif = await query(
      `INSERT INTO notifications (user_id, type, title, body, board_id, card_id)
       VALUES ($1,'comment_added',$2,$3,$4,$5) RETURNING *`,
      [user_id, `Novo comentário em "${cardTitle}"`, `${authorName}: ${text.trim().slice(0, 100)}`, req.params.boardId, req.params.cardId]
    );
    pushNotification(user_id, notif.rows[0]);
  }

  broadcastBoardUpdate(req.params.boardId);
  res.status(201).json(rows[0]);
});

// DELETE /api/boards/:boardId/cards/:cardId/comments/:id
router.delete('/:id', async (req, res) => {
  const { rows } = await query('SELECT user_id FROM comments WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Comentário não encontrado' });
  if (rows[0].user_id !== req.userId && req.boardRole !== 'owner') {
    return res.status(403).json({ error: 'Sem permissão para excluir este comentário' });
  }
  await query('DELETE FROM comments WHERE id=$1', [req.params.id]);
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

export default router;
