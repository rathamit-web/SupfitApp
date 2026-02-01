-- WORKOUT POSTS (social feed)
CREATE TABLE workout_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  image text,
  caption text,
  workout text,
  likes int DEFAULT 0,
  comments int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workout_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_workout_posts ON workout_posts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_insert_workout_posts ON workout_posts
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_update_own_workout_posts ON workout_posts
  FOR UPDATE USING (user_id = auth.uid());

-- WORKOUT POSTS LIKES (idempotent like tracking)
CREATE TABLE workout_posts_likes (
  id bigserial PRIMARY KEY,
  post_id uuid REFERENCES workout_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  idempotency_key text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE workout_posts_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_insert_own_like ON workout_posts_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_select_own_like ON workout_posts_likes
  FOR SELECT USING (user_id = auth.uid());

-- WORKOUT LIKES (for modal display)
CREATE TABLE workout_likes (
  id bigserial PRIMARY KEY,
  workout_id uuid REFERENCES workout_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_insert_own_workout_like ON workout_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_select_own_workout_like ON workout_likes
  FOR SELECT USING (user_id = auth.uid());

-- WORKOUT COMMENTS
CREATE TABLE workout_comments (
  id bigserial PRIMARY KEY,
  workout_id uuid REFERENCES workout_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  likes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_insert_own_comment ON workout_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_select_comments ON workout_comments
  FOR SELECT USING (true);

-- WORKOUT COMMENT REPLIES
CREATE TABLE workout_comment_replies (
  id bigserial PRIMARY KEY,
  comment_id bigint REFERENCES workout_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workout_comment_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_insert_own_reply ON workout_comment_replies
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_select_replies ON workout_comment_replies
  FOR SELECT USING (true);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  entity_id uuid,
  status text NOT NULL,
  amount int,
  valid_upto date,
  package_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_subscriptions ON subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_insert_own_subscription ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_update_own_subscription ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- PAYMENTS
CREATE TABLE payments (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subscription_id bigint REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount int NOT NULL,
  payment_date timestamptz NOT NULL,
  status text NOT NULL,
  method text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_payments ON payments
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_insert_own_payment ON payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- like_comment RPC (increments likes on a comment)
CREATE OR REPLACE FUNCTION like_comment(comment_id bigint, user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE workout_comments
  SET likes = likes + 1
  WHERE id = comment_id;
  -- Optionally, track who liked which comment in a separate table
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION like_comment(bigint, uuid) TO authenticated;