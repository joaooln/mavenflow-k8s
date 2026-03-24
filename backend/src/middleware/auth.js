import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// Verify the requesting user is a member of the given board
export async function requireBoardMember(req, res, next) {
  const boardId = req.params.boardId || req.params.id;
  const { rows } = await query(
    'SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2',
    [boardId, req.userId]
  );
  if (!rows.length) {
    return res.status(403).json({ error: 'Acesso negado a este board' });
  }
  req.boardRole = rows[0].role;
  next();
}

// Verify the requesting user is the owner of the board
export function requireBoardOwner(req, res, next) {
  if (req.boardRole !== 'owner') {
    return res.status(403).json({ error: 'Apenas o dono do board pode realizar esta ação' });
  }
  next();
}
