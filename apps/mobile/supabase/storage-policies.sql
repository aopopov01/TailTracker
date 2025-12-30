-- Storage Policies for TailTracker
-- This file sets up Row Level Security policies for Supabase Storage buckets

-- Pet Photos Bucket (Public)
-- Policy: Users can upload photos for their own pets
-- Anyone can view public pet photos (for lost pet alerts)
CREATE POLICY "Users can upload pet photos"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'pet-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own pet photos"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'pet-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own pet photos"
ON storage.objects FOR DELETE USING (
  bucket_id = 'pet-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view pet photos"
ON storage.objects FOR SELECT USING (
  bucket_id = 'pet-photos'
);

-- Documents Bucket (Private)
-- Policy: Users can only access their own documents
-- Used for vaccination records, medical documents, certificates
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- QR Codes Bucket (Public)
-- Policy: Users can generate QR codes, anyone can view them (for sharing)
CREATE POLICY "Users can upload QR codes"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own QR codes"
ON storage.objects FOR UPDATE USING (
  bucket_id = 'qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own QR codes"
ON storage.objects FOR DELETE USING (
  bucket_id = 'qr-codes' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view QR codes"
ON storage.objects FOR SELECT USING (
  bucket_id = 'qr-codes'
);

-- Helper function to get folder structure
-- Storage paths will be: bucket/user_id/pet_id/filename
-- This ensures proper access control and organization

-- Example usage in the app:
-- Pet Photo Upload: pet-photos/123e4567-e89b-12d3-a456-426614174000/pet-456/profile.jpg
-- Document Upload: documents/123e4567-e89b-12d3-a456-426614174000/vaccination-record.pdf
-- QR Code: qr-codes/123e4567-e89b-12d3-a456-426614174000/share-token-abc123.png