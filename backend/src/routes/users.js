import { Router } from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/users/me
router.get('/me', async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, initials, color, bio, created_at FROM users WHERE id = $1',
    [req.userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(rows[0]);
});

// PUT /api/users/me
router.put('/me', async (req, res) => {
  const { name, email, initials, color, bio } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });

  try {
    if (email) {
      const exists = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), req.userId]
      );
      if (exists.rows.length) return res.status(409).json({ error: 'Email já em uso' });
    }
    const { rows } = await query(
      `UPDATE users SET name=$1, email=COALESCE($2, email), initials=$3, color=$4, bio=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING id, name, email, initials, color, bio`,
      [name.trim(), email?.toLowerCase(), initials?.slice(0,2).toUpperCase() || 'EU', color || '#0A66C2', bio || '', req.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/users/search?q=email — used when inviting members
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 3) return res.json([]);
  const { rows } = await query(
    `SELECT id, name, email, initials, color FROM users
     WHERE (email ILIKE $1 OR name ILIKE $1) AND id != $2
     LIMIT 10`,
    [`%${q}%`, req.userId]
  );
  res.json(rows);
});

export default router;
