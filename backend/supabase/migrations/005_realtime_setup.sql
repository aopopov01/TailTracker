-- TailTracker Real-time Setup Migration
-- Timestamp: 2025-01-01T00:04:00Z
-- Description: Configure real-time subscriptions for live updates

-- Enable real-time on tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE lost_pets;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE pets;
ALTER PUBLICATION supabase_realtime ADD TABLE vaccinations;
ALTER PUBLICATION supabase_realtime ADD TABLE family_members;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;

-- Function to broadcast lost pet alerts to nearby users
CREATE OR REPLACE FUNCTION broadcast_lost_pet_alert()
RETURNS TRIGGER AS $$
DECLARE
  alert_payload JSONB;
  search_radius INTEGER;
BEGIN
  -- Only broadcast for newly created lost pet reports
  IF TG_OP = 'INSERT' AND NEW.status = 'lost' THEN
    search_radius := COALESCE(NEW.search_radius_km, 10);
    
    -- Create payload for real-time notification
    alert_payload := jsonb_build_object(
      'type', 'lost_pet_alert',
      'lost_pet_id', NEW.id,
      'pet_id', NEW.pet_id,
      'location', ST_AsGeoJSON(NEW.last_seen_location)::jsonb,
      'address', NEW.last_seen_address,
      'search_radius_km', search_radius,
      'last_seen_date', NEW.last_seen_date,
      'description', NEW.description,
      'reward_amount', NEW.reward_amount,
      'contact_phone', NEW.contact_phone,
      'photo_urls', NEW.photo_urls,
      'created_at', NEW.created_at
    );

    -- Broadcast to the 'lost_pet_alerts' channel
    PERFORM pg_notify('lost_pet_alerts', alert_payload::text);
  END IF;

  -- Broadcast status updates for found pets
  IF TG_OP = 'UPDATE' AND OLD.status = 'lost' AND NEW.status = 'found' THEN
    alert_payload := jsonb_build_object(
      'type', 'pet_found',
      'lost_pet_id', NEW.id,
      'pet_id', NEW.pet_id,
      'found_date', NEW.found_date,
      'found_by', NEW.found_by
    );

    PERFORM pg_notify('pet_found_alerts', alert_payload::text);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for lost pet alerts
DROP TRIGGER IF EXISTS lost_pet_alert_trigger ON lost_pets;
CREATE TRIGGER lost_pet_alert_trigger
  AFTER INSERT OR UPDATE ON lost_pets
  FOR EACH ROW EXECUTE FUNCTION broadcast_lost_pet_alert();

-- Function to broadcast vaccination reminders
CREATE OR REPLACE FUNCTION broadcast_vaccination_reminder()
RETURNS TRIGGER AS $$
DECLARE
  reminder_payload JSONB;
  user_ids UUID[];
  family_id UUID;
BEGIN
  -- Only process when a vaccination is inserted with a future due date
  IF TG_OP = 'INSERT' AND NEW.next_due_date IS NOT NULL AND NEW.next_due_date > CURRENT_DATE THEN
    -- Get family ID for the pet
    SELECT p.family_id INTO family_id 
    FROM pets p 
    WHERE p.id = NEW.pet_id;

    -- Get all family member user IDs with premium subscriptions
    SELECT array_agg(u.id) INTO user_ids
    FROM family_members fm
    JOIN users u ON fm.user_id = u.id
    WHERE fm.family_id = family_id
    AND u.subscription_status = 'premium';

    IF array_length(user_ids, 1) > 0 THEN
      reminder_payload := jsonb_build_object(
        'type', 'vaccination_reminder',
        'vaccination_id', NEW.id,
        'pet_id', NEW.pet_id,
        'vaccine_name', NEW.vaccine_name,
        'next_due_date', NEW.next_due_date,
        'user_ids', user_ids
      );

      PERFORM pg_notify('vaccination_reminders', reminder_payload::text);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vaccination reminders
DROP TRIGGER IF EXISTS vaccination_reminder_trigger ON vaccinations;
CREATE TRIGGER vaccination_reminder_trigger
  AFTER INSERT ON vaccinations
  FOR EACH ROW EXECUTE FUNCTION broadcast_vaccination_reminder();

-- Function to broadcast payment status updates
CREATE OR REPLACE FUNCTION broadcast_payment_update()
RETURNS TRIGGER AS $$
DECLARE
  payment_payload JSONB;
  user_id UUID;
BEGIN
  -- Get user ID from subscription
  SELECT s.user_id INTO user_id
  FROM subscriptions s
  WHERE s.id = NEW.subscription_id;

  IF user_id IS NOT NULL THEN
    payment_payload := jsonb_build_object(
      'type', 'payment_update',
      'payment_id', NEW.id,
      'subscription_id', NEW.subscription_id,
      'user_id', user_id,
      'status', NEW.status,
      'amount', NEW.amount,
      'currency', NEW.currency,
      'processed_at', NEW.processed_at
    );

    PERFORM pg_notify('payment_updates', payment_payload::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment updates
DROP TRIGGER IF EXISTS payment_update_trigger ON payments;
CREATE TRIGGER payment_update_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION broadcast_payment_update();

-- Function to broadcast subscription changes
CREATE OR REPLACE FUNCTION broadcast_subscription_update()
RETURNS TRIGGER AS $$
DECLARE
  subscription_payload JSONB;
  old_status TEXT;
  new_status TEXT;
BEGIN
  old_status := COALESCE(OLD.status, '');
  new_status := NEW.status;

  -- Only broadcast if status actually changed
  IF TG_OP = 'INSERT' OR old_status != new_status THEN
    subscription_payload := jsonb_build_object(
      'type', 'subscription_update',
      'subscription_id', NEW.id,
      'user_id', NEW.user_id,
      'plan_name', NEW.plan_name,
      'old_status', old_status,
      'new_status', new_status,
      'current_period_end', NEW.current_period_end,
      'cancel_at_period_end', NEW.cancel_at_period_end
    );

    PERFORM pg_notify('subscription_updates', subscription_payload::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscription updates
DROP TRIGGER IF EXISTS subscription_update_trigger ON subscriptions;
CREATE TRIGGER subscription_update_trigger
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION broadcast_subscription_update();

-- Function to broadcast family member changes
CREATE OR REPLACE FUNCTION broadcast_family_update()
RETURNS TRIGGER AS $$
DECLARE
  family_payload JSONB;
  family_member_ids UUID[];
BEGIN
  -- Get all family member user IDs
  SELECT array_agg(fm.user_id) INTO family_member_ids
  FROM family_members fm
  WHERE fm.family_id = COALESCE(NEW.family_id, OLD.family_id);

  IF TG_OP = 'INSERT' THEN
    family_payload := jsonb_build_object(
      'type', 'family_member_joined',
      'family_id', NEW.family_id,
      'user_id', NEW.user_id,
      'role', NEW.role,
      'family_member_ids', family_member_ids
    );
  ELSIF TG_OP = 'DELETE' THEN
    family_payload := jsonb_build_object(
      'type', 'family_member_left',
      'family_id', OLD.family_id,
      'user_id', OLD.user_id,
      'family_member_ids', family_member_ids
    );
  ELSIF TG_OP = 'UPDATE' THEN
    family_payload := jsonb_build_object(
      'type', 'family_member_updated',
      'family_id', NEW.family_id,
      'user_id', NEW.user_id,
      'old_role', OLD.role,
      'new_role', NEW.role,
      'family_member_ids', family_member_ids
    );
  END IF;

  PERFORM pg_notify('family_updates', family_payload::text);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for family updates
DROP TRIGGER IF EXISTS family_update_trigger ON family_members;
CREATE TRIGGER family_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON family_members
  FOR EACH ROW EXECUTE FUNCTION broadcast_family_update();

-- Function to broadcast pet status changes
CREATE OR REPLACE FUNCTION broadcast_pet_status_update()
RETURNS TRIGGER AS $$
DECLARE
  pet_payload JSONB;
  family_member_ids UUID[];
BEGIN
  -- Only broadcast status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Get all family member user IDs
    SELECT array_agg(fm.user_id) INTO family_member_ids
    FROM family_members fm
    WHERE fm.family_id = NEW.family_id;

    pet_payload := jsonb_build_object(
      'type', 'pet_status_update',
      'pet_id', NEW.id,
      'pet_name', NEW.name,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'family_id', NEW.family_id,
      'family_member_ids', family_member_ids
    );

    PERFORM pg_notify('pet_status_updates', pet_payload::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pet status updates
DROP TRIGGER IF EXISTS pet_status_update_trigger ON pets;
CREATE TRIGGER pet_status_update_trigger
  AFTER UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION broadcast_pet_status_update();

-- Function to clean up old notifications (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications
  WHERE read_at IS NOT NULL
  AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete unread notifications older than 90 days
  DELETE FROM notifications
  WHERE read_at IS NULL
  AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to send scheduled notifications
CREATE OR REPLACE FUNCTION send_scheduled_notifications()
RETURNS INTEGER AS $$
DECLARE
  notification_record RECORD;
  sent_count INTEGER := 0;
BEGIN
  -- Get notifications scheduled for now or past
  FOR notification_record IN
    SELECT * FROM notifications
    WHERE scheduled_for IS NOT NULL
    AND scheduled_for <= NOW()
    AND sent_at IS NULL
    ORDER BY scheduled_for ASC
    LIMIT 100
  LOOP
    -- Mark as sent
    UPDATE notifications
    SET sent_at = NOW()
    WHERE id = notification_record.id;
    
    sent_count := sent_count + 1;
  END LOOP;
  
  RETURN sent_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for real-time performance
CREATE INDEX IF NOT EXISTS idx_lost_pets_realtime ON lost_pets(status, created_at) WHERE status = 'lost';
CREATE INDEX IF NOT EXISTS idx_notifications_realtime ON notifications(user_id, sent_at, scheduled_for) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vaccinations_due_realtime ON vaccinations(next_due_date) WHERE next_due_date IS NOT NULL AND next_due_date > CURRENT_DATE;

-- Grant necessary permissions for real-time
GRANT SELECT ON lost_pets TO authenticated;
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON pets TO authenticated;
GRANT SELECT ON vaccinations TO authenticated;
GRANT SELECT ON family_members TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;