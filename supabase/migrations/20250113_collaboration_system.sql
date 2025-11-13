-- Collaboration System Migration
-- Adds comprehensive real-time collaboration features like Figma/Notion

-- ============================================
-- 1. USERS & TEAM MEMBERS
-- ============================================

-- Team members table (extends auth.users if using Supabase Auth)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_seen_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. PRESENCE SYSTEM
-- ============================================

-- Real-time presence tracking
CREATE TABLE user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  is_online BOOLEAN NOT NULL DEFAULT true,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  status_message TEXT,
  current_page TEXT, -- Current page/route user is viewing
  current_entity_type TEXT, -- task, workflow, project, etc.
  current_entity_id UUID, -- ID of entity they're viewing/editing
  activity_type TEXT, -- viewing, editing, typing, commenting
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL, -- Browser session ID
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- User cursors for real-time cursor tracking
CREATE TABLE user_cursors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  page TEXT NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  element_id TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6', -- User's cursor color
  last_moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_id, page)
);

-- ============================================
-- 3. COMMENTS & ANNOTATIONS
-- ============================================

-- Comments on any entity
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- task, workflow, project, file, etc.
  entity_id UUID NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threading
  author_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}', -- User IDs mentioned with @
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  position JSONB, -- Optional position data for spatial comments
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment reactions (emoji reactions)
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- e.g., '👍', '❤️', '🎉'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

-- ============================================
-- 4. NOTIFICATIONS SYSTEM
-- ============================================

-- User notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'mention',
    'comment',
    'task_assigned',
    'task_completed',
    'task_updated',
    'workflow_updated',
    'chat_message',
    'watching_update',
    'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  triggered_by_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_digest_frequency TEXT DEFAULT 'daily' CHECK (email_digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'never')),
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  mention_notifications BOOLEAN NOT NULL DEFAULT true,
  comment_notifications BOOLEAN NOT NULL DEFAULT true,
  task_notifications BOOLEAN NOT NULL DEFAULT true,
  workflow_notifications BOOLEAN NOT NULL DEFAULT true,
  chat_notifications BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. CHAT SYSTEM
-- ============================================

-- Chat rooms (project rooms or direct messages)
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  type TEXT NOT NULL CHECK (type IN ('direct', 'project', 'team', 'channel')),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat room members
CREATE TABLE chat_room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'code', 'system')),
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  mentions UUID[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]', -- Array of file URLs/metadata
  is_edited BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat message reactions
CREATE TABLE chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- ============================================
-- 6. ACTIVITY FEED (Enhanced)
-- ============================================

-- Detailed activity tracking for collaboration
CREATE TABLE collaboration_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'task_created',
    'task_updated',
    'task_completed',
    'task_assigned',
    'workflow_created',
    'workflow_updated',
    'comment_added',
    'comment_resolved',
    'file_uploaded',
    'member_joined',
    'member_left',
    'chat_message',
    'entity_watched',
    'entity_unwatched'
  )),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  changes JSONB, -- Detailed change information
  mentioned_users UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. WATCHING / FOLLOWING SYSTEM
-- ============================================

-- Watch/follow entities for notifications
CREATE TABLE entity_watchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  watch_type TEXT NOT NULL DEFAULT 'all' CHECK (watch_type IN ('all', 'mentions', 'comments', 'changes')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- ============================================
-- 8. EDIT LOCKS (Optional)
-- ============================================

-- Optimistic locking for collaborative editing
CREATE TABLE edit_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  locked_by_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE(entity_type, entity_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Presence indexes
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_is_online ON user_presence(is_online);
CREATE INDEX idx_user_presence_current_entity ON user_presence(current_entity_type, current_entity_id);
CREATE INDEX idx_user_presence_heartbeat ON user_presence(last_heartbeat DESC);
CREATE INDEX idx_user_cursors_page ON user_cursors(page);
CREATE INDEX idx_user_cursors_last_moved ON user_cursors(last_moved_at DESC);

-- Comments indexes
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentions);
CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);

-- Chat indexes
CREATE INDEX idx_chat_rooms_project ON chat_rooms(project_id);
CREATE INDEX idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_mentions ON chat_messages USING GIN(mentions);

-- Activity indexes
CREATE INDEX idx_collaboration_activities_user ON collaboration_activities(user_id);
CREATE INDEX idx_collaboration_activities_entity ON collaboration_activities(entity_type, entity_id);
CREATE INDEX idx_collaboration_activities_project ON collaboration_activities(project_id);
CREATE INDEX idx_collaboration_activities_created ON collaboration_activities(created_at DESC);
CREATE INDEX idx_collaboration_activities_mentions ON collaboration_activities USING GIN(mentioned_users);

-- Watchers indexes
CREATE INDEX idx_entity_watchers_user ON entity_watchers(user_id);
CREATE INDEX idx_entity_watchers_entity ON entity_watchers(entity_type, entity_id);

-- Edit locks indexes
CREATE INDEX idx_edit_locks_entity ON edit_locks(entity_type, entity_id);
CREATE INDEX idx_edit_locks_expires ON edit_locks(expires_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup old presence data
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  -- Mark users as offline if no heartbeat for 5 minutes
  UPDATE user_presence
  SET is_online = false, status = 'offline'
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes'
  AND is_online = true;

  -- Delete old cursor data (older than 1 hour)
  DELETE FROM user_cursors
  WHERE last_moved_at < NOW() - INTERVAL '1 hour';

  -- Delete expired edit locks
  DELETE FROM edit_locks
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_locks ENABLE ROW LEVEL SECURITY;

-- Permissive policies (adjust based on your auth requirements)
CREATE POLICY "Enable read access for all users" ON team_members FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON team_members FOR UPDATE USING (true);

CREATE POLICY "Enable all access for presence" ON user_presence FOR ALL USING (true);
CREATE POLICY "Enable all access for cursors" ON user_cursors FOR ALL USING (true);
CREATE POLICY "Enable all access for comments" ON comments FOR ALL USING (true);
CREATE POLICY "Enable all access for comment reactions" ON comment_reactions FOR ALL USING (true);
CREATE POLICY "Enable read access for notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for notifications" ON notifications FOR UPDATE USING (true);
CREATE POLICY "Enable all access for notification_preferences" ON notification_preferences FOR ALL USING (true);
CREATE POLICY "Enable all access for chat_rooms" ON chat_rooms FOR ALL USING (true);
CREATE POLICY "Enable all access for chat_room_members" ON chat_room_members FOR ALL USING (true);
CREATE POLICY "Enable all access for chat_messages" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Enable all access for chat_message_reactions" ON chat_message_reactions FOR ALL USING (true);
CREATE POLICY "Enable read access for activities" ON collaboration_activities FOR SELECT USING (true);
CREATE POLICY "Enable insert access for activities" ON collaboration_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable all access for watchers" ON entity_watchers FOR ALL USING (true);
CREATE POLICY "Enable all access for edit_locks" ON edit_locks FOR ALL USING (true);

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE user_cursors;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE edit_locks;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Create a default team member (adjust as needed)
INSERT INTO team_members (email, name, role)
VALUES
  ('admin@example.com', 'Admin User', 'owner'),
  ('user1@example.com', 'John Doe', 'member'),
  ('user2@example.com', 'Jane Smith', 'member')
ON CONFLICT (email) DO NOTHING;
