-- Lost Pet Alert System Enhancement
-- Adds user locations and push tokens for proximity-based notifications

-- Create user_locations table for tracking opted-in user locations
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  accuracy_meters FLOAT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create push_tokens table for push notification delivery
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Create lost_pet_notifications junction table for tracking which users were notified
CREATE TABLE IF NOT EXISTS lost_pet_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lost_pet_report_id UUID REFERENCES lost_pet_reports(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  distance_meters FLOAT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lost_pet_report_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_locations_location ON user_locations USING gist(location);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_active ON user_locations(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_lost_pet_notifications_report_id ON lost_pet_notifications(lost_pet_report_id);
CREATE INDEX IF NOT EXISTS idx_lost_pet_notifications_user_id ON lost_pet_notifications(user_id);

-- Enable RLS on new tables
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pet_notifications ENABLE ROW LEVEL SECURITY;

-- USER LOCATIONS POLICIES
CREATE POLICY "Users can view own location" ON user_locations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own location" ON user_locations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own location" ON user_locations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own location" ON user_locations
  FOR DELETE USING (user_id = auth.uid());

-- PUSH TOKENS POLICIES
CREATE POLICY "Users can view own push tokens" ON push_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push tokens" ON push_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own push tokens" ON push_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own push tokens" ON push_tokens
  FOR DELETE USING (user_id = auth.uid());

-- LOST PET NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON lost_pet_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON lost_pet_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON lost_pet_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Drop and recreate the find_nearby_users function with correct logic
DROP FUNCTION IF EXISTS find_nearby_users(FLOAT, FLOAT, INTEGER);

CREATE OR REPLACE FUNCTION find_nearby_users_for_alert(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_meters INTEGER DEFAULT 5000,
  exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  push_tokens TEXT[],
  distance_meters FLOAT,
  platform TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ul.user_id,
    ARRAY_AGG(DISTINCT pt.token) FILTER (WHERE pt.token IS NOT NULL) as push_tokens,
    ST_Distance(
      ST_Point(center_lng, center_lat)::geography,
      ul.location
    ) as distance_meters,
    ARRAY_AGG(DISTINCT pt.platform) FILTER (WHERE pt.platform IS NOT NULL) as platform
  FROM user_locations ul
  JOIN user_profiles up ON up.user_id = ul.user_id
  LEFT JOIN push_tokens pt ON pt.user_id = ul.user_id AND pt.is_active = true
  WHERE ul.is_active = true
    AND up.location_sharing_enabled = true
    AND (up.notification_preferences->>'lost_pet_alerts')::boolean = true
    AND ST_DWithin(
      ST_Point(center_lng, center_lat)::geography,
      ul.location,
      radius_meters
    )
    AND (exclude_user_id IS NULL OR ul.user_id != exclude_user_id)
  GROUP BY ul.user_id, ul.location
  ORDER BY distance_meters
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create lost pet alerts (Pro tier only)
CREATE OR REPLACE FUNCTION can_create_lost_pet_alert(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  sub_status subscription_status;
  sub_tier TEXT;
BEGIN
  SELECT
    up.subscription_status,
    up.preferences->>'subscription_tier'
  INTO sub_status, sub_tier
  FROM user_profiles up
  WHERE up.user_id = user_uuid;

  -- Only Pro tier can create alerts
  RETURN sub_status = 'active'
    AND sub_tier = 'pro'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = user_uuid
      AND subscription_expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the insert policy for lost_pet_reports to check Pro tier
DROP POLICY IF EXISTS "Users can insert own lost pet reports" ON lost_pet_reports;

CREATE POLICY "Pro users can insert lost pet reports" ON lost_pet_reports
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = lost_pet_reports.pet_id
      AND pets.user_id = auth.uid()
    )
    AND can_create_lost_pet_alert(auth.uid())
  );

-- Function to update user location
CREATE OR REPLACE FUNCTION update_user_location(
  lat FLOAT,
  lng FLOAT,
  accuracy FLOAT DEFAULT NULL
)
RETURNS user_locations AS $$
DECLARE
  result user_locations;
BEGIN
  INSERT INTO user_locations (user_id, location, accuracy_meters, last_updated)
  VALUES (
    auth.uid(),
    ST_Point(lng, lat)::geography,
    accuracy,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    location = ST_Point(lng, lat)::geography,
    accuracy_meters = accuracy,
    last_updated = NOW(),
    is_active = true
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send lost pet alert to nearby users
CREATE OR REPLACE FUNCTION send_lost_pet_alert(
  report_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  report_record lost_pet_reports;
  pet_record pets;
  nearby_user RECORD;
  notification_count INTEGER := 0;
  alert_lat FLOAT;
  alert_lng FLOAT;
BEGIN
  -- Get the report details
  SELECT * INTO report_record FROM lost_pet_reports WHERE id = report_id;

  IF report_record IS NULL THEN
    RAISE EXCEPTION 'Lost pet report not found';
  END IF;

  -- Get the pet details
  SELECT * INTO pet_record FROM pets WHERE id = report_record.pet_id;

  -- Extract coordinates from geography
  SELECT ST_Y(report_record.last_seen_location::geometry), ST_X(report_record.last_seen_location::geometry)
  INTO alert_lat, alert_lng;

  -- Find nearby users and create notifications
  FOR nearby_user IN
    SELECT * FROM find_nearby_users_for_alert(
      alert_lat,
      alert_lng,
      report_record.alert_radius,
      report_record.user_id
    )
  LOOP
    -- Insert notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data,
      is_read,
      is_sent,
      send_at
    ) VALUES (
      nearby_user.user_id,
      'lost_pet',
      'Lost Pet Alert: ' || pet_record.name,
      'A ' || pet_record.species || ' named ' || pet_record.name ||
        ' is missing ' || ROUND(nearby_user.distance_meters::numeric / 1000, 1) || 'km from you',
      jsonb_build_object(
        'report_id', report_id,
        'pet_id', pet_record.id,
        'pet_name', pet_record.name,
        'species', pet_record.species,
        'breed', pet_record.breed,
        'photo_url', COALESCE(pet_record.photos[1], NULL),
        'distance_meters', nearby_user.distance_meters,
        'location', jsonb_build_object('lat', alert_lat, 'lng', alert_lng),
        'reward', report_record.reward_amount
      ),
      false,
      false,
      NOW()
    );

    -- Track which users were notified
    INSERT INTO lost_pet_notifications (
      lost_pet_report_id,
      user_id,
      distance_meters
    ) VALUES (
      report_id,
      nearby_user.user_id,
      nearby_user.distance_meters
    )
    ON CONFLICT (lost_pet_report_id, user_id) DO NOTHING;

    notification_count := notification_count + 1;
  END LOOP;

  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update user_locations timestamp
CREATE OR REPLACE FUNCTION update_user_locations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_locations_updated_at
  BEFORE UPDATE ON user_locations
  FOR EACH ROW EXECUTE FUNCTION update_user_locations_timestamp();

-- Create trigger to automatically send alerts when a new lost pet report is created
CREATE OR REPLACE FUNCTION trigger_send_lost_pet_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send alerts for new reports that are active
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    PERFORM send_lost_pet_alert(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lost_pet_report_alert_trigger
  AFTER INSERT ON lost_pet_reports
  FOR EACH ROW EXECUTE FUNCTION trigger_send_lost_pet_alerts();

COMMENT ON TABLE user_locations IS 'Stores opt-in user locations for lost pet proximity alerts';
COMMENT ON TABLE push_tokens IS 'Stores push notification tokens for all platforms';
COMMENT ON TABLE lost_pet_notifications IS 'Tracks which users have been notified about lost pet reports';
COMMENT ON FUNCTION find_nearby_users_for_alert IS 'Finds users within radius of coordinates who have opted into location sharing and lost pet alerts';
COMMENT ON FUNCTION can_create_lost_pet_alert IS 'Checks if user has Pro subscription required for creating lost pet alerts';
COMMENT ON FUNCTION send_lost_pet_alert IS 'Sends notifications to nearby users about a lost pet report';
