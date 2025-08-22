-- TailTracker Authentication Setup Migration
-- Timestamp: 2025-01-01T00:03:00Z
-- Description: Configure Supabase Auth settings and user creation triggers

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  family_invite_code TEXT;
BEGIN
  -- Generate unique family invite code
  family_invite_code := generate_invite_code();
  
  -- Create user profile in public.users table
  INSERT INTO public.users (
    auth_user_id,
    email,
    full_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );

  -- Create default family for the user
  INSERT INTO public.families (
    name,
    description,
    owner_id,
    invite_code,
    created_at,
    updated_at
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Family'),
    'Default family for ' || COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    (SELECT id FROM public.users WHERE auth_user_id = NEW.id),
    family_invite_code,
    NOW(),
    NOW()
  );

  -- Add user as owner of their default family
  INSERT INTO public.family_members (
    family_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    (SELECT id FROM public.families WHERE owner_id = (SELECT id FROM public.users WHERE auth_user_id = NEW.id)),
    (SELECT id FROM public.users WHERE auth_user_id = NEW.id),
    'owner',
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle user metadata updates
CREATE OR REPLACE FUNCTION handle_user_metadata_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile when auth.users metadata changes
  UPDATE public.users 
  SET 
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
    updated_at = NOW()
  WHERE auth_user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle user metadata updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_metadata_update();

-- Function to handle user deletion (GDPR compliance)
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark user as deleted in public.users table
  UPDATE public.users 
  SET deleted_at = NOW()
  WHERE auth_user_id = OLD.id;

  -- Create audit log entry
  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    created_at
  ) VALUES (
    (SELECT id FROM public.users WHERE auth_user_id = OLD.id),
    'users',
    (SELECT id FROM public.users WHERE auth_user_id = OLD.id),
    'delete',
    to_jsonb(OLD),
    NOW()
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_deletion();

-- Function to validate phone number format
CREATE OR REPLACE FUNCTION is_valid_phone(phone_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Basic phone number validation (E.164 format)
  RETURN phone_number ~ '^\+[1-9]\d{1,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate secure family invite codes
CREATE OR REPLACE FUNCTION generate_family_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (no confusing characters)
    code := upper(
      translate(
        encode(gen_random_bytes(6), 'base64'),
        '0O1Il+/=',
        'ABCDEFGH'
      )
    );
    code := substring(code from 1 for 8);
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM families WHERE invite_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Update the existing generate_invite_code function to use the new secure version
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN generate_family_invite_code();
END;
$$ LANGUAGE plpgsql;

-- Function to join family by invite code
CREATE OR REPLACE FUNCTION join_family_by_invite_code(
  user_auth_id UUID,
  invite_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  target_family_id UUID;
  user_id UUID;
  family_name TEXT;
  current_member_count INTEGER;
  max_members INTEGER;
BEGIN
  -- Get user's internal ID
  SELECT id INTO user_id 
  FROM users 
  WHERE auth_user_id = user_auth_id;
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Find family by invite code
  SELECT f.id, f.name, f.max_members INTO target_family_id, family_name, max_members
  FROM families f
  WHERE f.invite_code = join_family_by_invite_code.invite_code;
  
  IF target_family_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_id = target_family_id AND user_id = join_family_by_invite_code.user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this family');
  END IF;

  -- Check family member limit
  SELECT COUNT(*) INTO current_member_count
  FROM family_members
  WHERE family_id = target_family_id;
  
  IF current_member_count >= max_members THEN
    RETURN jsonb_build_object('success', false, 'error', 'Family has reached maximum member limit');
  END IF;

  -- Add user to family
  INSERT INTO family_members (
    family_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    target_family_id,
    user_id,
    'member',
    NOW()
  );

  -- Send notification to family owner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    scheduled_for
  )
  SELECT 
    f.owner_id,
    'family_invite',
    'New Family Member',
    u.full_name || ' has joined your family "' || f.name || '"',
    target_family_id,
    NOW()
  FROM families f, users u
  WHERE f.id = target_family_id AND u.id = user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'family_id', target_family_id,
    'family_name', family_name,
    'message', 'Successfully joined family'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify email confirmation status
CREATE OR REPLACE FUNCTION is_email_confirmed(user_auth_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  confirmed BOOLEAN;
BEGIN
  SELECT email_confirmed_at IS NOT NULL INTO confirmed
  FROM auth.users
  WHERE id = user_auth_id;
  
  RETURN COALESCE(confirmed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has completed onboarding
CREATE OR REPLACE FUNCTION has_completed_onboarding(user_auth_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
  has_pets BOOLEAN;
  has_profile BOOLEAN;
BEGIN
  -- Get user's internal ID
  SELECT id INTO user_id 
  FROM users 
  WHERE auth_user_id = user_auth_id;
  
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user has a complete profile
  SELECT (full_name IS NOT NULL AND full_name != '') INTO has_profile
  FROM users
  WHERE id = user_id;

  -- Check if user has added at least one pet
  SELECT EXISTS(
    SELECT 1 FROM pets p
    JOIN families f ON p.family_id = f.id
    JOIN family_members fm ON f.id = fm.family_id
    WHERE fm.user_id = user_id
    AND p.deleted_at IS NULL
  ) INTO has_pets;

  RETURN COALESCE(has_profile, false) AND COALESCE(has_pets, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send welcome notification
CREATE OR REPLACE FUNCTION send_welcome_notification(user_auth_id UUID)
RETURNS VOID AS $$
DECLARE
  user_id UUID;
  user_name TEXT;
BEGIN
  -- Get user info
  SELECT id, full_name INTO user_id, user_name
  FROM users 
  WHERE auth_user_id = user_auth_id;
  
  IF user_id IS NULL THEN
    RETURN;
  END IF;

  -- Send welcome notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    scheduled_for
  ) VALUES (
    user_id,
    'welcome',
    'Welcome to TailTracker!',
    'Welcome ' || COALESCE(user_name, 'to TailTracker') || '! Start by adding your first pet to get the most out of our app.',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraint to ensure unique invite codes
ALTER TABLE families 
ADD CONSTRAINT families_invite_code_unique UNIQUE (invite_code);

-- Add constraint to ensure phone number format
ALTER TABLE users 
ADD CONSTRAINT users_phone_format_check 
CHECK (phone IS NULL OR is_valid_phone(phone));

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION join_family_by_invite_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_email_confirmed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_completed_onboarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_welcome_notification(UUID) TO authenticated;