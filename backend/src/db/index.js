import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'mavenflow',
  user:     process.env.DB_USER     || 'mavenflow',
  password: process.env.DB_PASSWORD || 'mavenflow',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = (text, params) => pool.query(text, params);

export async function initSchema() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema initialized');
}

// Helper: build a full board object (the shape the frontend expects)
export async function getBoardFull(boardId) {
  // Board info + members
  const boardRes = await query(
    `SELECT b.id, b.title, b.background, b.owner_id, b.created_at,
            json_agg(DISTINCT jsonb_build_object(
              'id', u.id, 'name', u.name, 'initials', u.initials, 'color', u.color, 'role', bm.role
            )) FILTER (WHERE u.id IS NOT NULL) AS members
     FROM boards b
     LEFT JOIN board_members bm ON bm.board_id = b.id
     LEFT JOIN users u ON u.id = bm.user_id
     WHERE b.id = $1
     GROUP BY b.id`,
    [boardId]
  );
  if (!boardRes.rows.length) return null;
  const board = boardRes.rows[0];

  // Labels
  const labelsRes = await query(
    'SELECT id, name, color FROM labels WHERE board_id = $1 ORDER BY created_at',
    [boardId]
  );

  // Columns
  const colsRes = await query(
    'SELECT id, title, position FROM columns WHERE board_id = $1 ORDER BY position',
    [boardId]
  );

  // All cards for this board (joined with their data)
  const cardsRes = await query(
    `SELECT
       c.id, c.column_id, c.title, c.description, c.category,
       c.status, c.priority, c.due_date, c.progress, c.archived,
       c.position, c.created_at,
       COALESCE(array_agg(DISTINCT cl.label_id::text) FILTER (WHERE cl.label_id IS NOT NULL), '{}') AS label_ids,
       COALESCE(array_agg(DISTINCT cm.user_id::text)  FILTER (WHERE cm.user_id IS NOT NULL),  '{}') AS member_ids
     FROM cards c
     LEFT JOIN card_labels cl ON cl.card_id = c.id
     LEFT JOIN card_members cm ON cm.card_id = c.id
     WHERE c.column_id = ANY(SELECT id FROM columns WHERE board_id = $1)
     GROUP BY c.id
     ORDER BY c.position`,
    [boardId]
  );

  // Checklists + items
  const clRes = await query(
    `SELECT cl.id, cl.card_id, cl.title, cl.position,
            COALESCE(
              json_agg(
                jsonb_build_object('id', ci.id, 'text', ci.text, 'checked', ci.checked)
                ORDER BY ci.position
              ) FILTER (WHERE ci.id IS NOT NULL),
              '[]'
            ) AS items
     FROM checklists cl
     LEFT JOIN checklist_items ci ON ci.checklist_id = cl.id
     WHERE cl.card_id = ANY(SELECT id FROM cards WHERE column_id = ANY(SELECT id FROM columns WHERE board_id = $1))
     GROUP BY cl.id ORDER BY cl.card_id, cl.position`,
    [boardId]
  );

  // Comments
  const commentsRes = await query(
    `SELECT cm.id, cm.card_id, cm.text, cm.created_at,
            u.name AS author
     FROM comments cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.card_id = ANY(SELECT id FROM cards WHERE column_id = ANY(SELECT id FROM columns WHERE board_id = $1))
     ORDER BY cm.created_at`,
    [boardId]
  );

  // Activity
  const activityRes = await query(
    `SELECT a.id, a.card_id, a.text, a.created_at,
            COALESCE(u.name, 'Sistema') AS author
     FROM activity a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.card_id = ANY(SELECT id FROM cards WHERE column_id = ANY(SELECT id FROM columns WHERE board_id = $1))
     ORDER BY a.created_at`,
    [boardId]
  );

  // Build maps for fast lookup
  const clByCard = {};
  for (const cl of clRes.rows) {
    if (!clByCard[cl.card_id]) clByCard[cl.card_id] = [];
    clByCard[cl.card_id].push({ id: cl.id, title: cl.title, items: cl.items });
  }

  const commentsByCard = {};
  for (const cm of commentsRes.rows) {
    if (!commentsByCard[cm.card_id]) commentsByCard[cm.card_id] = [];
    commentsByCard[cm.card_id].push({ id: cm.id, text: cm.text, author: cm.author, timestamp: cm.created_at });
  }

  const activityByCard = {};
  for (const a of activityRes.rows) {
    if (!activityByCard[a.card_id]) activityByCard[a.card_id] = [];
    activityByCard[a.card_id].push({ id: a.id, text: a.text, author: a.author, timestamp: a.created_at });
  }

  // Build tasks per column
  const tasksByCol = {};
  for (const card of cardsRes.rows) {
    if (!tasksByCol[card.column_id]) tasksByCol[card.column_id] = [];
    tasksByCol[card.column_id].push({
      id:          card.id,
      title:       card.title,
      description: card.description,
      category:    card.category,
      status:      card.status,
      priority:    card.priority,
      dueDate:     card.due_date ? card.due_date.toISOString().split('T')[0] : '',
      progress:    card.progress,
      archived:    card.archived,
      labelIds:    card.label_ids,
      memberIds:   card.member_ids,
      checklists:  clByCard[card.id]       || [],
      comments:    commentsByCard[card.id]  || [],
      activity:    activityByCard[card.id]  || [],
      attachments: 0,
      createdAt:   card.created_at,
    });
  }

  return {
    id:         board.id,
    title:      board.title,
    background: board.background,
    ownerId:    board.owner_id,
    labels:     labelsRes.rows,
    members:    board.members || [],
    columns:    colsRes.rows.map(col => ({
      id:    col.id,
      title: col.title,
      tasks: tasksByCol[col.id] || [],
    })),
  };
}
