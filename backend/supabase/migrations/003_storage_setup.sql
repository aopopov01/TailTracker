-- TailTracker Storage Setup Migration
-- Timestamp: 2025-01-01T00:02:00Z
-- Description: Configure Supabase Storage buckets and policies for file management

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('pet-photos', 'pet-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vaccination-certificates', 'vaccination-certificates', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('lost-pet-photos', 'lost-pet-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('medical-documents', 'medical-documents', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Pet Photos Storage Policies
CREATE POLICY "Public pet photos are viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'pet-photos');

CREATE POLICY "Users can upload pet photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pet-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Pet owners can update their pet photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Pet owners can delete their pet photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- User Avatars Storage Policies
CREATE POLICY "Public avatars are viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Vaccination Certificates Storage Policies (Private)
CREATE POLICY "Users can view their vaccination certificates" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vaccination-certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload vaccination certificates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vaccination-certificates' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their vaccination certificates" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'vaccination-certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their vaccination certificates" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vaccination-certificates'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Lost Pet Photos Storage Policies (Public for visibility)
CREATE POLICY "Public lost pet photos are viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'lost-pet-photos');

CREATE POLICY "Users can upload lost pet photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lost-pet-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Pet owners can update their lost pet photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'lost-pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Pet owners can delete their lost pet photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'lost-pet-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Medical Documents Storage Policies (Private)
CREATE POLICY "Users can view their medical documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'medical-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload medical documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'medical-documents' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their medical documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'medical-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their medical documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'medical-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to generate storage path with user ID
CREATE OR REPLACE FUNCTION generate_storage_path(
  user_auth_id UUID,
  bucket_name TEXT,
  filename TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN user_auth_id::text || '/' || bucket_name || '/' || filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate file upload limits based on subscription
CREATE OR REPLACE FUNCTION validate_file_upload(
  user_auth_id UUID,
  bucket_name TEXT,
  file_size BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_subscription TEXT;
  current_usage BIGINT;
  max_size BIGINT;
BEGIN
  -- Get user subscription status
  SELECT u.subscription_status INTO user_subscription
  FROM users u 
  WHERE u.auth_user_id = user_auth_id;
  
  -- Check subscription-based limits
  IF user_subscription = 'free' THEN
    -- Free tier: 50MB total storage per user
    SELECT COALESCE(SUM(size), 0) INTO current_usage
    FROM storage.objects 
    WHERE (storage.foldername(name))[1] = user_auth_id::text;
    
    max_size := 52428800; -- 50MB
    
    IF current_usage + file_size > max_size THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete files from pet-photos bucket where pet no longer exists
  DELETE FROM storage.objects
  WHERE bucket_id = 'pet-photos'
  AND name LIKE '%/%'
  AND NOT EXISTS (
    SELECT 1 FROM pets p
    JOIN users u ON p.created_by = u.id
    WHERE u.auth_user_id::text = (storage.foldername(name))[1]
    AND p.profile_photo_url LIKE '%' || (storage.foldername(name))[2] || '%'
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;