-- TailTracker Authentication Setup
-- This migration sets up automatic user profile creation and auth triggers

-- Function to create user profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );
  
  -- Log the user creation activity
  INSERT INTO public.activity_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    new_values,
    created_at
  )
  VALUES (
    NEW.id,
    'create',
    'user_profile',
    NEW.id,
    jsonb_build_object(
      'email', NEW.email,
      'signup_method', COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
    ),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user profile updates
CREATE OR REPLACE FUNCTION public.handle_user_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  -- Log profile completeness changes
  IF OLD.preferences IS DISTINCT FROM NEW.preferences 
     OR OLD.privacy_settings IS DISTINCT FROM NEW.privacy_settings
     OR OLD.notification_preferences IS DISTINCT FROM NEW.notification_preferences THEN
    
    INSERT INTO public.activity_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      created_at
    )
    VALUES (
      NEW.user_id,
      'update_preferences',
      'user_profile',
      NEW.id,
      jsonb_build_object(
        'preferences', OLD.preferences,
        'privacy_settings', OLD.privacy_settings,
        'notification_preferences', OLD.notification_preferences
      ),
      jsonb_build_object(
        'preferences', NEW.preferences,
        'privacy_settings', NEW.privacy_settings,
        'notification_preferences', NEW.notification_preferences
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user profile updates
CREATE TRIGGER on_user_profile_update
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_update();

-- Function to handle subscription status changes
CREATE OR REPLACE FUNCTION public.handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile subscription status
  UPDATE public.user_profiles 
  SET 
    subscription_status = CASE 
      WHEN NEW.status = 'completed' THEN 'active'::subscription_status
      WHEN NEW.status = 'failed' OR NEW.status = 'refunded' THEN 'inactive'::subscription_status
      ELSE OLD.subscription_status
    END,
    subscription_expires_at = CASE
      WHEN NEW.status = 'completed' THEN NEW.subscription_period_end
      ELSE subscription_expires_at
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Create notification for subscription changes
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data,
      created_at
    )
    VALUES (
      NEW.user_id,
      'subscription'::notification_type,
      'Premium Activated!',
      'Your TailTracker Premium subscription is now active. Enjoy all premium features!',
      jsonb_build_object(
        'subscription_id', NEW.id,
        'product_id', NEW.product_id,
        'expires_at', NEW.subscription_period_end
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for subscription transaction changes
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE ON public.subscription_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_subscription_change();

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
  -- Delete old notifications (older than 30 days)
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_read = true;
  
  -- Delete expired family sharing invitations (older than 7 days)
  DELETE FROM public.family_sharing 
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '7 days';
  
  -- Delete old activity logs (older than 90 days)
  DELETE FROM public.activity_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Update expired subscriptions
  UPDATE public.user_profiles 
  SET subscription_status = 'inactive'::subscription_status
  WHERE subscription_status = 'active'::subscription_status
  AND subscription_expires_at < NOW();
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible pets (for API)
CREATE OR REPLACE FUNCTION public.get_user_accessible_pets(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  name TEXT,
  species pet_species,
  breed TEXT,
  photos TEXT[],
  status pet_status,
  profile_completeness INTEGER,
  is_owner BOOLEAN,
  shared_permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.species,
    p.breed,
    p.photos,
    p.status,
    p.profile_completeness,
    (p.user_id = user_uuid) as is_owner,
    CASE 
      WHEN p.user_id = user_uuid THEN 
        '{"view": true, "edit": true, "medical_records": true, "sharing": true}'::jsonb
      ELSE 
        COALESCE(fs.permissions, '{}'::jsonb)
    END as shared_permissions
  FROM public.pets p
  LEFT JOIN public.family_sharing fs ON (
    fs.pet_id = p.id 
    AND fs.shared_with_user_id = user_uuid 
    AND fs.status = 'accepted'
  )
  WHERE p.user_id = user_uuid 
     OR fs.id IS NOT NULL
  ORDER BY 
    (p.user_id = user_uuid) DESC, -- Owner pets first
    p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get nearby lost pets for map view
CREATE OR REPLACE FUNCTION public.get_nearby_lost_pets(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_meters INTEGER DEFAULT 10000
)
RETURNS TABLE (
  id UUID,
  pet_id UUID,
  pet_name TEXT,
  pet_species pet_species,
  pet_photos TEXT[],
  last_seen_date TIMESTAMPTZ,
  last_seen_location GEOGRAPHY,
  last_seen_address TEXT,
  description TEXT,
  urgency alert_urgency,
  reward_amount DECIMAL,
  contact_phone TEXT,
  distance_meters FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lpr.id,
    lpr.pet_id,
    p.name as pet_name,
    p.species as pet_species,
    p.photos as pet_photos,
    lpr.last_seen_date,
    lpr.last_seen_location,
    lpr.last_seen_address,
    lpr.description,
    lpr.urgency,
    lpr.reward_amount,
    lpr.contact_phone,
    ST_Distance(
      ST_Point(center_lng, center_lat)::geography,
      lpr.last_seen_location
    ) as distance_meters
  FROM public.lost_pet_reports lpr
  JOIN public.pets p ON p.id = lpr.pet_id
  WHERE lpr.status = 'active'
    AND lpr.is_resolved = false
    AND ST_DWithin(
      ST_Point(center_lng, center_lat)::geography,
      lpr.last_seen_location,
      radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action on pet
CREATE OR REPLACE FUNCTION public.user_can_access_pet(
  pet_uuid UUID,
  required_permission TEXT DEFAULT 'view',
  user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN := false;
  has_permission BOOLEAN := false;
BEGIN
  -- Check if user owns the pet
  SELECT (user_id = user_uuid) INTO is_owner
  FROM public.pets 
  WHERE id = pet_uuid;
  
  -- Owner has all permissions
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- Check family sharing permissions
  SELECT (permissions->>required_permission)::boolean INTO has_permission
  FROM public.family_sharing 
  WHERE pet_id = pet_uuid 
    AND shared_with_user_id = user_uuid 
    AND status = 'accepted';
  
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification to user
CREATE OR REPLACE FUNCTION public.send_notification(
  target_user_id UUID,
  notification_type_param notification_type,
  title_param TEXT,
  message_param TEXT,
  data_param JSONB DEFAULT '{}'::jsonb,
  send_at_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data,
    send_at,
    created_at
  )
  VALUES (
    target_user_id,
    notification_type_param,
    title_param,
    message_param,
    data_param,
    send_at_param,
    NOW()
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create family sharing invitation
CREATE OR REPLACE FUNCTION public.create_family_sharing_invite(
  pet_uuid UUID,
  target_email TEXT,
  permissions_param JSONB DEFAULT '{"view": true, "edit": false, "medical_records": true, "sharing": false}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  target_user_id UUID;
  sharing_id UUID;
  pet_name TEXT;
  owner_name TEXT;
BEGIN
  -- Get target user ID from email
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;
  
  -- Get pet and owner information
  SELECT p.name, up.full_name INTO pet_name, owner_name
  FROM public.pets p
  JOIN public.user_profiles up ON up.user_id = p.user_id
  WHERE p.id = pet_uuid AND p.user_id = auth.uid();
  
  IF pet_name IS NULL THEN
    RAISE EXCEPTION 'Pet not found or access denied';
  END IF;
  
  -- Create family sharing record
  INSERT INTO public.family_sharing (
    pet_id,
    owner_user_id,
    shared_with_user_id,
    permissions,
    status,
    expires_at,
    created_at
  )
  VALUES (
    pet_uuid,
    auth.uid(),
    target_user_id,
    permissions_param,
    'pending',
    NOW() + INTERVAL '7 days', -- Invitation expires in 7 days
    NOW()
  )
  RETURNING id INTO sharing_id;
  
  -- Send notification to target user
  PERFORM public.send_notification(
    target_user_id,
    'family_sharing',
    'Pet Sharing Invitation',
    format('%s invited you to help manage %s', owner_name, pet_name),
    jsonb_build_object(
      'sharing_id', sharing_id,
      'pet_id', pet_uuid,
      'pet_name', pet_name,
      'owner_name', owner_name,
      'permissions', permissions_param
    )
  );
  
  RETURN sharing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to family sharing invitation
CREATE OR REPLACE FUNCTION public.respond_to_sharing_invite(
  sharing_uuid UUID,
  response TEXT -- 'accepted' or 'declined'
)
RETURNS VOID AS $$
DECLARE
  pet_name TEXT;
  owner_user_id UUID;
  shared_user_name TEXT;
BEGIN
  -- Validate response
  IF response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid response. Must be "accepted" or "declined"';
  END IF;
  
  -- Get sharing information
  SELECT 
    p.name,
    fs.owner_user_id,
    up.full_name
  INTO pet_name, owner_user_id, shared_user_name
  FROM public.family_sharing fs
  JOIN public.pets p ON p.id = fs.pet_id
  JOIN public.user_profiles up ON up.user_id = fs.shared_with_user_id
  WHERE fs.id = sharing_uuid 
    AND fs.shared_with_user_id = auth.uid()
    AND fs.status = 'pending';
  
  IF pet_name IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already processed';
  END IF;
  
  -- Update sharing status
  UPDATE public.family_sharing 
  SET 
    status = response,
    updated_at = NOW()
  WHERE id = sharing_uuid;
  
  -- Notify pet owner of response
  PERFORM public.send_notification(
    owner_user_id,
    'family_sharing',
    format('Sharing Invitation %s', CASE response WHEN 'accepted' THEN 'Accepted' ELSE 'Declined' END),
    format('%s %s your invitation to help manage %s', 
           shared_user_name, 
           CASE response WHEN 'accepted' THEN 'accepted' ELSE 'declined' END, 
           pet_name),
    jsonb_build_object(
      'sharing_id', sharing_uuid,
      'response', response,
      'pet_name', pet_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;