-- Database functions for lost pet alerts
-- These functions provide geospatial queries for the lost pet alert system

-- Function to find users within a specific radius of a lost pet location
CREATE OR REPLACE FUNCTION find_users_within_radius(
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  push_token TEXT,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.push_token,
    ST_Distance(
      ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
      ST_GeogFromText('POINT(' || u.longitude || ' ' || u.latitude || ')')
    ) / 1000.0 as distance_km
  FROM users u
  WHERE 
    u.push_token IS NOT NULL
    AND u.latitude IS NOT NULL 
    AND u.longitude IS NOT NULL
    AND u.subscription_status IN ('free', 'premium', 'family') -- Active users only
    AND ST_DWithin(
      ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
      ST_GeogFromText('POINT(' || u.longitude || ' ' || u.latitude || ')'),
      radius_km * 1000 -- Convert km to meters
    )
  ORDER BY distance_km ASC
  LIMIT 100; -- Reasonable limit to prevent spam
END;
$$;

-- Function to get lost pets within radius of user location
CREATE OR REPLACE FUNCTION get_lost_pets_within_radius(
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 25
)
RETURNS TABLE(
  id UUID,
  pet_id UUID,
  pet_name TEXT,
  species TEXT,
  breed TEXT,
  photo_url TEXT,
  last_seen_location JSON,
  last_seen_address TEXT,
  last_seen_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  reward_amount DECIMAL,
  reward_currency TEXT,
  contact_phone TEXT,
  distance_km DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id,
    lp.pet_id,
    p.name as pet_name,
    p.species,
    p.breed,
    p.photo_url,
    json_build_object(
      'lat', ST_Y(lp.last_seen_location::geometry),
      'lng', ST_X(lp.last_seen_location::geometry)
    ) as last_seen_location,
    lp.last_seen_address,
    lp.last_seen_date,
    lp.description,
    lp.reward_amount,
    lp.reward_currency,
    lp.contact_phone,
    ST_Distance(
      ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
      lp.last_seen_location
    ) / 1000.0 as distance_km,
    lp.created_at
  FROM lost_pets lp
  JOIN pets p ON lp.pet_id = p.id
  WHERE 
    lp.status = 'lost'
    AND lp.created_at > NOW() - INTERVAL '30 days' -- Only recent reports
    AND ST_DWithin(
      ST_GeogFromText('POINT(' || center_lng || ' ' || center_lat || ')'),
      lp.last_seen_location,
      radius_km * 1000 -- Convert km to meters
    )
  ORDER BY distance_km ASC, lp.created_at DESC
  LIMIT 50;
END;
$$;

-- Function to check if user has premium access for lost pet features
CREATE OR REPLACE FUNCTION user_has_premium_access(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  user_subscription TEXT;
BEGIN
  SELECT subscription_status INTO user_subscription
  FROM users
  WHERE id = user_id;
  
  RETURN user_subscription IN ('premium', 'family');
END;
$$;

-- RLS Policies for lost_pets table
ALTER TABLE lost_pets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view lost pets within their region
CREATE POLICY "Users can view regional lost pets" ON lost_pets
  FOR SELECT USING (
    -- Allow viewing if user has location and pet is within reasonable distance
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()
      AND u.latitude IS NOT NULL 
      AND u.longitude IS NOT NULL
      AND ST_DWithin(
        ST_GeogFromText('POINT(' || u.longitude || ' ' || u.latitude || ')'),
        last_seen_location,
        50000 -- 50km radius for viewing
      )
    )
  );

-- Policy: Only premium users can create lost pet reports
CREATE POLICY "Premium users can create lost pet reports" ON lost_pets
  FOR INSERT WITH CHECK (
    auth.uid() = reported_by
    AND user_has_premium_access(auth.uid())
  );

-- Policy: Pet owners and reporters can update their reports
CREATE POLICY "Owners can update lost pet reports" ON lost_pets
  FOR UPDATE USING (
    auth.uid() = reported_by
    OR auth.uid() IN (
      SELECT p.created_by FROM pets p WHERE p.id = pet_id
    )
  );

-- Policy: Pet owners and reporters can delete their reports
CREATE POLICY "Owners can delete lost pet reports" ON lost_pets
  FOR DELETE USING (
    auth.uid() = reported_by
    OR auth.uid() IN (
      SELECT p.created_by FROM pets p WHERE p.id = pet_id
    )
  );