DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('admin', 'employee');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  organization VARCHAR(150),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  subject VARCHAR(255),
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  is_spam BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  parent_email_id INTEGER REFERENCES emails(id),
  is_cc BOOLEAN DEFAULT false,
  is_cc_recipient BOOLEAN DEFAULT false,
  is_bcc_recipient BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_emails_receiver_id_deleted_spam ON emails(receiver_id, is_deleted, is_spam);
CREATE INDEX idx_emails_receiver_id_archived_deleted_spam ON emails(receiver_id, is_archived, is_deleted, is_spam);
CREATE INDEX idx_emails_receiver_id_important_deleted_spam ON emails(receiver_id, is_important, is_deleted, is_spam);
CREATE INDEX idx_emails_receiver_id_starred_deleted_spam ON emails(receiver_id, is_starred, is_deleted, is_spam);
CREATE INDEX idx_emails_receiver_id_spam_deleted ON emails(receiver_id, is_spam, is_deleted);
CREATE INDEX idx_emails_sender_id_deleted_cc ON emails(sender_id, is_deleted, is_cc_recipient);
CREATE INDEX idx_emails_receiver_id_created_at ON emails(receiver_id, created_at DESC);
CREATE INDEX idx_emails_sender_id_created_at ON emails(sender_id, created_at DESC);
CREATE INDEX idx_emails_parent_email_id ON emails(parent_email_id);
CREATE INDEX idx_emails_sender_id_receiver_id ON emails(sender_id, receiver_id);
CREATE INDEX idx_emails_subject_content ON emails(subject, content);

CREATE TABLE IF NOT EXISTS email_attachments (
  id SERIAL PRIMARY KEY,
  email_id INTEGER REFERENCES emails(id),
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_attachments_email_id ON email_attachments(email_id);

CREATE TABLE IF NOT EXISTS email_labels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_email_labels_user_id ON email_labels(user_id);

CREATE TABLE IF NOT EXISTS email_label_mappings (
  id SERIAL PRIMARY KEY,
  email_id INTEGER REFERENCES emails(id),
  label_id INTEGER REFERENCES email_labels(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email_id, label_id)
);

CREATE INDEX idx_email_label_mappings_email_id ON email_label_mappings(email_id);
CREATE INDEX idx_email_label_mappings_label_id ON email_label_mappings(label_id);

CREATE TABLE IF NOT EXISTS email_drafts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  receiver_email VARCHAR(255),
  subject VARCHAR(255),
  content TEXT,
  has_attachments BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_drafts_user_id_updated_at ON email_drafts(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES chat_groups(id),
  user_id INTEGER REFERENCES users(id),
  is_admin BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_chat_group_members_group_id ON chat_group_members(group_id);
CREATE INDEX idx_chat_group_members_user_id ON chat_group_members(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES chat_groups(id),
  sender_id INTEGER REFERENCES users(id),
  content TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  has_attachments BOOLEAN DEFAULT false,
  parent_message_id INTEGER REFERENCES chat_messages(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_group_id_created_at ON chat_messages(group_id, created_at DESC);

CREATE TABLE IF NOT EXISTS chat_message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES chat_messages(id),
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_message_attachments_message_id ON chat_message_attachments(message_id);

CREATE TABLE IF NOT EXISTS chat_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES chat_messages(id),
  user_id INTEGER REFERENCES users(id),
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_chat_reactions_message_id ON chat_reactions(message_id);

CREATE TABLE IF NOT EXISTS chat_private_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  parent_message_id INTEGER REFERENCES chat_private_messages(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_private_messages_sender_receiver_created ON chat_private_messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX idx_chat_private_messages_receiver_id_is_read ON chat_private_messages(receiver_id, is_read);

CREATE TABLE IF NOT EXISTS chat_private_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES chat_private_messages(id),
  file_name VARCHAR(255),
  file_path VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_private_attachments_message_id ON chat_private_attachments(message_id);

CREATE TABLE IF NOT EXISTS email_filters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filter_name VARCHAR(255),
  conditions JSONB,
  action VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_filters_user_id ON email_filters(user_id);

CREATE TABLE IF NOT EXISTS email_cc (
  id SERIAL PRIMARY KEY,
  email_id INTEGER REFERENCES emails(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('cc', 'bcc')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email_id, user_id, type)
);

CREATE INDEX idx_email_cc_email_id ON email_cc(email_id);
CREATE INDEX idx_email_cc_user_id ON email_cc(user_id);

ALTER TABLE email_drafts ADD COLUMN IF NOT EXISTS cc TEXT;
ALTER TABLE email_drafts ADD COLUMN IF NOT EXISTS bcc TEXT;