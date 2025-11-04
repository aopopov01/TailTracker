-- TailTracker Row Level Security Policies
-- This migration creates comprehensive RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pet_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- USER PROFILES POLICIES
-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- PETS POLICIES
-- Users can access their own pets and pets shared with them
CREATE POLICY "Users can view own pets" ON pets
  FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM family_sharing 
      WHERE family_sharing.pet_id = pets.id 
      AND family_sharing.shared_with_user_id = auth.uid() 
      AND family_sharing.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert own pets" ON pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pets" ON pets
  FOR UPDATE USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM family_sharing 
      WHERE family_sharing.pet_id = pets.id 
      AND family_sharing.shared_with_user_id = auth.uid() 
      AND family_sharing.status = 'accepted'
      AND (family_sharing.permissions->>'edit')::boolean = true
    )
  );

CREATE POLICY "Users can delete own pets" ON pets
  FOR DELETE USING (auth.uid() = user_id);

-- Public access to lost pets for community search
CREATE POLICY "Public can view lost pets" ON pets
  FOR SELECT USING (status = 'lost' AND is_public = true);

-- MEDICAL RECORDS POLICIES
CREATE POLICY "Users can view medical records for accessible pets" ON medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND (
        pets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_sharing 
          WHERE family_sharing.pet_id = pets.id 
          AND family_sharing.shared_with_user_id = auth.uid() 
          AND family_sharing.status = 'accepted'
          AND (family_sharing.permissions->>'medical_records')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can insert medical records for own pets" ON medical_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update medical records for accessible pets" ON medical_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND (
        pets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_sharing 
          WHERE family_sharing.pet_id = pets.id 
          AND family_sharing.shared_with_user_id = auth.uid() 
          AND family_sharing.status = 'accepted'
          AND (family_sharing.permissions->>'edit')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can delete medical records for own pets" ON medical_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = medical_records.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

-- VACCINATIONS POLICIES
CREATE POLICY "Users can view vaccinations for accessible pets" ON vaccinations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = vaccinations.pet_id 
      AND (
        pets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_sharing 
          WHERE family_sharing.pet_id = pets.id 
          AND family_sharing.shared_with_user_id = auth.uid() 
          AND family_sharing.status = 'accepted'
          AND (family_sharing.permissions->>'medical_records')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can insert vaccinations for own pets" ON vaccinations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = vaccinations.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vaccinations for accessible pets" ON vaccinations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = vaccinations.pet_id 
      AND (
        pets.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM family_sharing 
          WHERE family_sharing.pet_id = pets.id 
          AND family_sharing.shared_with_user_id = auth.uid() 
          AND family_sharing.status = 'accepted'
          AND (family_sharing.permissions->>'edit')::boolean = true
        )
      )
    )
  );

CREATE POLICY "Users can delete vaccinations for own pets" ON vaccinations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = vaccinations.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

-- LOST PET REPORTS POLICIES
CREATE POLICY "Users can view own lost pet reports" ON lost_pet_reports
  FOR SELECT USING (user_id = auth.uid());

-- Public can view active lost pet reports for community assistance
CREATE POLICY "Public can view active lost pet reports" ON lost_pet_reports
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert own lost pet reports" ON lost_pet_reports
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = lost_pet_reports.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own lost pet reports" ON lost_pet_reports
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own lost pet reports" ON lost_pet_reports
  FOR DELETE USING (user_id = auth.uid());

-- PET SIGHTINGS POLICIES
-- Anyone can view sightings for active lost pet reports
CREATE POLICY "Public can view sightings for active reports" ON pet_sightings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lost_pet_reports 
      WHERE lost_pet_reports.id = pet_sightings.lost_pet_report_id 
      AND lost_pet_reports.status = 'active'
    )
  );

-- Users can report sightings for any active lost pet
CREATE POLICY "Users can report sightings" ON pet_sightings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lost_pet_reports 
      WHERE lost_pet_reports.id = pet_sightings.lost_pet_report_id 
      AND lost_pet_reports.status = 'active'
    )
  );

-- Pet owners can verify sightings of their pets
CREATE POLICY "Pet owners can update sightings" ON pet_sightings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lost_pet_reports 
      JOIN pets ON pets.id = lost_pet_reports.pet_id
      WHERE lost_pet_reports.id = pet_sightings.lost_pet_report_id 
      AND pets.user_id = auth.uid()
    )
  );

-- FAMILY SHARING POLICIES
CREATE POLICY "Users can view sharing involving them" ON family_sharing
  FOR SELECT USING (
    owner_user_id = auth.uid() 
    OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "Pet owners can create sharing invites" ON family_sharing
  FOR INSERT WITH CHECK (
    owner_user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = family_sharing.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Involved users can update sharing status" ON family_sharing
  FOR UPDATE USING (
    owner_user_id = auth.uid() 
    OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "Pet owners can delete sharing" ON family_sharing
  FOR DELETE USING (owner_user_id = auth.uid());

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- System service can create notifications

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- HEALTH REMINDERS POLICIES
CREATE POLICY "Users can view reminders for accessible pets" ON health_reminders
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = health_reminders.pet_id 
      AND pets.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM family_sharing 
      WHERE family_sharing.pet_id = health_reminders.pet_id 
      AND family_sharing.shared_with_user_id = auth.uid() 
      AND family_sharing.status = 'accepted'
      AND (family_sharing.permissions->>'medical_records')::boolean = true
    )
  );

CREATE POLICY "Users can create reminders for own pets" ON health_reminders
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = health_reminders.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reminders" ON health_reminders
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders" ON health_reminders
  FOR DELETE USING (user_id = auth.uid());

-- SUBSCRIPTION TRANSACTIONS POLICIES
CREATE POLICY "Users can view own transactions" ON subscription_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert transactions" ON subscription_transactions
  FOR INSERT WITH CHECK (true); -- Payment system can create transactions

-- ACTIVITY LOGS POLICIES
-- Users can view logs related to their pets and activities
CREATE POLICY "Users can view relevant activity logs" ON activity_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM pets 
      WHERE pets.id = activity_logs.pet_id 
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true); -- System can log all activities

-- Create function to check if user is premium subscriber
CREATE OR REPLACE FUNCTION is_premium_user(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = user_uuid 
    AND subscription_status = 'active'
    AND subscription_expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check family sharing permissions
CREATE OR REPLACE FUNCTION has_pet_permission(pet_uuid UUID, permission_type TEXT DEFAULT 'view')
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID := auth.uid();
BEGIN
  -- Check if user owns the pet
  IF EXISTS (
    SELECT 1 FROM pets 
    WHERE id = pet_uuid AND user_id = user_uuid
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user has shared access with required permission
  RETURN EXISTS (
    SELECT 1 FROM family_sharing 
    WHERE pet_id = pet_uuid 
    AND shared_with_user_id = user_uuid 
    AND status = 'accepted'
    AND (permissions->>permission_type)::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find nearby users for lost pet alerts
CREATE OR REPLACE FUNCTION find_nearby_users(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  user_id UUID,
  push_token TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    up.user_id,
    up.notification_preferences->>'push_token' as push_token,
    ST_Distance(
      ST_Point(center_lng, center_lat)::geography,
      ST_Point(
        (lpr.last_seen_location).longitude,
        (lpr.last_seen_location).latitude
      )::geography
    ) as distance_meters
  FROM user_profiles up
  JOIN pets p ON p.user_id = up.user_id
  JOIN lost_pet_reports lpr ON true -- Cross join to get all combinations
  WHERE up.location_sharing_enabled = true
    AND up.notification_preferences->>'lost_pet_alerts' = 'true'
    AND ST_DWithin(
      ST_Point(center_lng, center_lat)::geography,
      ST_Point(
        (lpr.last_seen_location).longitude,
        (lpr.last_seen_location).latitude
      )::geography,
      radius_meters
    )
    AND up.user_id != auth.uid() -- Exclude the pet owner
  ORDER BY distance_meters
  LIMIT 50; -- Limit to avoid spam
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
  action_name TEXT,
  resource_type_name TEXT,
  resource_uuid UUID DEFAULT NULL,
  old_data JSONB DEFAULT NULL,
  new_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_logs (
    user_id,
    pet_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    CASE WHEN resource_type_name = 'pet' THEN resource_uuid ELSE NULL END,
    action_name,
    resource_type_name,
    resource_uuid,
    old_data,
    new_data,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically log activities
CREATE OR REPLACE FUNCTION trigger_log_activity()
RETURNS TRIGGER AS $$
BEGIN
  CASE TG_OP
    WHEN 'INSERT' THEN
      PERFORM log_user_activity(
        'create',
        TG_TABLE_NAME,
        NEW.id,
        NULL,
        to_jsonb(NEW)
      );
      RETURN NEW;
    WHEN 'UPDATE' THEN
      PERFORM log_user_activity(
        'update',
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
      RETURN NEW;
    WHEN 'DELETE' THEN
      PERFORM log_user_activity(
        'delete',
        TG_TABLE_NAME,
        OLD.id,
        to_jsonb(OLD),
        NULL
      );
      RETURN OLD;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Apply activity logging triggers to key tables
CREATE TRIGGER pets_activity_log 
  AFTER INSERT OR UPDATE OR DELETE ON pets
  FOR EACH ROW EXECUTE FUNCTION trigger_log_activity();

CREATE TRIGGER medical_records_activity_log 
  AFTER INSERT OR UPDATE OR DELETE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION trigger_log_activity();

CREATE TRIGGER lost_pet_reports_activity_log 
  AFTER INSERT OR UPDATE OR DELETE ON lost_pet_reports
  FOR EACH ROW EXECUTE FUNCTION trigger_log_activity();

CREATE TRIGGER family_sharing_activity_log 
  AFTER INSERT OR UPDATE OR DELETE ON family_sharing
  FOR EACH ROW EXECUTE FUNCTION trigger_log_activity();