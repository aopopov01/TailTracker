-- TailTracker Row-Level Security (RLS) Policies
-- Multi-tenant data isolation for 150K+ users

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE veterinarians ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_veterinarians ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's families
CREATE OR REPLACE FUNCTION get_user_families(user_auth_id UUID)
RETURNS TABLE(family_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT fm.family_id
  FROM family_members fm
  JOIN users u ON fm.user_id = u.id
  WHERE u.auth_user_id = user_auth_id;
$$;

-- Helper function to check if user is family member
CREATE OR REPLACE FUNCTION is_family_member(target_family_id UUID, user_auth_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM family_members fm
    JOIN users u ON fm.user_id = u.id
    WHERE fm.family_id = target_family_id
    AND u.auth_user_id = user_auth_id
  );
$$;

-- Users table RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Users can view family members" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      JOIN users u ON fm2.user_id = u.id
      WHERE fm1.user_id = users.id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Families table RLS policies
CREATE POLICY "Family owners can manage their families" ON families
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = owner_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can view their families" ON families
  FOR SELECT USING (
    is_family_member(id, auth.uid())
  );

-- Family members table RLS policies
CREATE POLICY "Family members can view family membership" ON family_members
  FOR SELECT USING (
    is_family_member(family_id, auth.uid())
  );

CREATE POLICY "Family owners can manage members" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families f
      JOIN users u ON f.owner_id = u.id
      WHERE f.id = family_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join families" ON family_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Pets table RLS policies
CREATE POLICY "Family members can view pets" ON pets
  FOR SELECT USING (
    is_family_member(family_id, auth.uid())
  );

CREATE POLICY "Family members can manage pets" ON pets
  FOR ALL USING (
    is_family_member(family_id, auth.uid())
  );

-- Veterinarians table RLS policies (public data with restrictions)
CREATE POLICY "Authenticated users can view veterinarians" ON veterinarians
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create veterinarians" ON veterinarians
  FOR INSERT TO authenticated WITH CHECK (true);

-- Pet veterinarians table RLS policies
CREATE POLICY "Family members can manage pet veterinarians" ON pet_veterinarians
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_id
      AND is_family_member(p.family_id, auth.uid())
    )
  );

-- Vaccinations table RLS policies
CREATE POLICY "Family members can manage pet vaccinations" ON vaccinations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_id
      AND is_family_member(p.family_id, auth.uid())
    )
  );

-- Medications table RLS policies
CREATE POLICY "Family members can manage pet medications" ON medications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_id
      AND is_family_member(p.family_id, auth.uid())
    )
  );

-- Medical records table RLS policies
CREATE POLICY "Family members can manage medical records" ON medical_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_id
      AND is_family_member(p.family_id, auth.uid())
    )
  );

-- Lost pets table RLS policies
CREATE POLICY "Anyone can view active lost pets" ON lost_pets
  FOR SELECT USING (status = 'lost');

CREATE POLICY "Family members can manage lost pet reports" ON lost_pets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = pet_id
      AND is_family_member(p.family_id, auth.uid())
    )
  );

-- Notifications table RLS policies
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Subscriptions table RLS policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL TO service_role USING (true);

-- Payments table RLS policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = subscription_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL TO service_role USING (true);

-- Stripe webhook events table RLS policies (service role only)
CREATE POLICY "Service role can manage webhook events" ON stripe_webhook_events
  FOR ALL TO service_role USING (true);

-- Feature usage table RLS policies
CREATE POLICY "Users can view own feature usage" ON feature_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage feature usage" ON feature_usage
  FOR ALL TO service_role USING (true);

-- Files table RLS policies
CREATE POLICY "Users can manage own files" ON files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Public files are viewable" ON files
  FOR SELECT USING (is_public = true);

-- Audit logs table RLS policies
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- GDPR requests table RLS policies
CREATE POLICY "Users can manage own GDPR requests" ON gdpr_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Service role permissions (for background jobs, admin operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;