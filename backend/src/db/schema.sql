-- Mavenflow Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  initials      VARCHAR(2)   NOT NULL DEFAULT 'EU',
  color         VARCHAR(7)   NOT NULL DEFAULT '#0A66C2',
  bio           TEXT         NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Boards ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boards (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      VARCHAR(255) NOT NULL,
  background VARCHAR(255) NOT NULL DEFAULT '#0A66C2',
  owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Board Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_members (
  board_id  UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  role      VARCHAR(20) NOT NULL DEFAULT 'member', -- 'owner' | 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);

-- ── Labels ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS labels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(7)   NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Columns ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS columns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  position   INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Cards ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id   UUID        NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  category    VARCHAR(100) NOT NULL DEFAULT 'Geral',
  status      VARCHAR(50)  NOT NULL DEFAULT 'Todo',
  priority    VARCHAR(20)  NOT NULL DEFAULT 'Medium',
  due_date    DATE,
  progress    INTEGER      NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  archived    BOOLEAN      NOT NULL DEFAULT FALSE,
  position    INTEGER      NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Card Labels ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS card_labels (
  card_id  UUID NOT NULL REFERENCES cards(id)  ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);

-- ── Card Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS card_members (
  card_id UUID NOT NULL REFERENCES cards(id)  ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  PRIMARY KEY (card_id, user_id)
);

-- ── Checklists ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  position   INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Checklist Items ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checklist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID        NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  text         VARCHAR(500) NOT NULL,
  checked      BOOLEAN      NOT NULL DEFAULT FALSE,
  position     INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID NOT NULL REFERENCES cards(id)  ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Activity Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID REFERENCES cards(id)  ON DELETE CASCADE,
  board_id   UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id)  ON DELETE SET NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  type       VARCHAR(50)  NOT NULL, -- 'card_assigned' | 'comment_added' | 'board_invite'
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  board_id   UUID REFERENCES boards(id) ON DELETE SET NULL,
  card_id    UUID REFERENCES cards(id)  ON DELETE SET NULL,
  read       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_board_members_user   ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_columns_board        ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_column         ON cards(column_id);
CREATE INDEX IF NOT EXISTS idx_card_labels_card     ON card_labels(card_id);
CREATE INDEX IF NOT EXISTS idx_card_members_card    ON card_members(card_id);
CREATE INDEX IF NOT EXISTS idx_checklists_card      ON checklists(card_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_cl   ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_comments_card        ON comments(card_id);
CREATE INDEX IF NOT EXISTS idx_activity_card        ON activity(card_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
