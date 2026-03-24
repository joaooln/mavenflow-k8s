import { Router } from 'express';
import { query, getBoardFull } from '../db/index.js';
import { authenticate, requireBoardMember, requireBoardOwner } from '../middleware/auth.js';
import { broadcastBoardUpdate, pushNotification } from '../websocket/index.js';

const router = Router();
router.use(authenticate);

// GET /api/boards — boards the user is a member of
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT b.id, b.title, b.background, b.owner_id,
            COUNT(DISTINCT bm2.user_id) AS member_count,
            COUNT(DISTINCT c.id) FILTER (WHERE NOT c.archived) AS card_count
     FROM boards b
     JOIN board_members bm ON bm.board_id = b.id AND bm.user_id = $1
     LEFT JOIN board_members bm2 ON bm2.board_id = b.id
     LEFT JOIN columns col ON col.board_id = b.id
     LEFT JOIN cards c ON c.column_id = col.id
     GROUP BY b.id
     ORDER BY b.created_at`,
    [req.userId]
  );
  res.json(rows);
});

// POST /api/boards — create board
router.post('/', async (req, res) => {
  const { title, background } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Título é obrigatório' });

  const { rows } = await query(
    'INSERT INTO boards (title, background, owner_id) VALUES ($1, $2, $3) RETURNING id',
    [title.trim(), background || '#0A66C2', req.userId]
  );
  const boardId = rows[0].id;

  // Creator is automatically an owner member
  await query(
    'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)',
    [boardId, req.userId, 'owner']
  );

  // Default columns
  await query(
    `INSERT INTO columns (board_id, title, position) VALUES
     ($1, 'A FAZER', 0), ($1, 'EM ANDAMENTO', 1), ($1, 'CONCLUÍDO', 2)`,
    [boardId]
  );

  const board = await getBoardFull(boardId);
  res.status(201).json(board);
});

// GET /api/boards/:id
router.get('/:id', requireBoardMember, async (req, res) => {
  const board = await getBoardFull(req.params.id);
  if (!board) return res.status(404).json({ error: 'Board não encontrado' });
  res.json(board);
});

// PUT /api/boards/:id
router.put('/:id', requireBoardMember, requireBoardOwner, async (req, res) => {
  const { title, background } = req.body;
  await query(
    'UPDATE boards SET title=COALESCE($1,title), background=COALESCE($2,background), updated_at=NOW() WHERE id=$3',
    [title?.trim(), background, req.params.id]
  );
  broadcastBoardUpdate(req.params.id);
  res.json({ ok: true });
});

// DELETE /api/boards/:id
router.delete('/:id', requireBoardMember, requireBoardOwner, async (req, res) => {
  await query('DELETE FROM boards WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ── Members ───────────────────────────────────────────────────────────────────

// GET /api/boards/:boardId/members
router.get('/:boardId/members', requireBoardMember, async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.initials, u.color, bm.role, bm.joined_at
     FROM board_members bm JOIN users u ON u.id = bm.user_id
     WHERE bm.board_id = $1 ORDER BY bm.joined_at`,
    [req.params.boardId]
  );
  res.json(rows);
});

// POST /api/boards/:boardId/members — invite by userId or email
router.post('/:boardId/members', requireBoardMember, requireBoardOwner, async (req, res) => {
  const { userId, email } = req.body;
  let targetId = userId;

  if (!targetId && email) {
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado com este email' });
    targetId = rows[0].id;
  }
  if (!targetId) return res.status(400).json({ error: 'userId ou email obrigatório' });

  const exists = await query(
    'SELECT 1 FROM board_members WHERE board_id=$1 AND user_id=$2',
    [req.params.boardId, targetId]
  );
  if (exists.rows.length) return res.status(409).json({ error: 'Usuário já é membro' });

  await query(
    'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3)',
    [req.params.boardId, targetId, 'member']
  );

  // Board title for notification
  const boardRes = await query('SELECT title FROM boards WHERE id=$1', [req.params.boardId]);
  const boardTitle = boardRes.rows[0]?.title || 'um board';

  // Create notification
  const notifRes = await query(
    `INSERT INTO notifications (user_id, type, title, body, board_id)
     VALUES ($1, 'board_invite', $2, $3, $4) RETURNING *`,
    [targetId, 'Convite para board', `Você foi adicionado ao board "${boardTitle}"`, req.params.boardId]
  );
  pushNotification(targetId, notifRes.rows[0]);
  broadcastBoardUpdate(req.params.boardId);

  res.status(201).json({ ok: true });
});

// DELETE /api/boards/:boardId/members/:userId
router.delete('/:boardId/members/:userId', requireBoardMember, requireBoardOwner, async (req, res) => {
  if (req.params.userId === req.userId) {
    return res.status(400).json({ error: 'O dono não pode remover a si mesmo' });
  }
  await query(
    'DELETE FROM board_members WHERE board_id=$1 AND user_id=$2',
    [req.params.boardId, req.params.userId]
  );
  broadcastBoardUpdate(req.params.boardId);
  res.json({ ok: true });
});

export default router;
