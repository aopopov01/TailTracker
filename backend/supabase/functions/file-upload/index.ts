// TailTracker File Upload Edge Function
// Handles secure file uploads with automatic resizing and validation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UploadRequest {
  bucket: string
  folder?: string
  filename: string
  file_data: string // base64 encoded
  content_type: string
  resize?: {
    width: number
    height: number
    quality?: number
  }
}

const ALLOWED_BUCKETS = [
  'pet-photos',
  'vaccination-certificates', 
  'user-avatars',
  'lost-pet-photos',
  'medical-documents'
]

const BUCKET_LIMITS = {
  'pet-photos': { max_size: 50 * 1024 * 1024, allowed_types: ['image/jpeg', 'image/png', 'image/webp'] },
  'vaccination-certificates': { max_size: 10 * 1024 * 1024, allowed_types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
  'user-avatars': { max_size: 5 * 1024 * 1024, allowed_types: ['image/jpeg', 'image/png', 'image/webp'] },
  'lost-pet-photos': { max_size: 50 * 1024 * 1024, allowed_types: ['image/jpeg', 'image/png', 'image/webp'] },
  'medical-documents': { max_size: 20 * 1024 * 1024, allowed_types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    )

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const method = req.method
    const url = new URL(req.url)

    switch (method) {
      case 'POST':
        return await handleFileUpload(supabaseClient, user.id, req)
      case 'DELETE':
        return await handleFileDelete(supabaseClient, user.id, url.searchParams)
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('File upload function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleFileUpload(supabaseClient: any, userId: string, req: Request) {
  try {
    const uploadData: UploadRequest = await req.json()

    // Validate bucket
    if (!ALLOWED_BUCKETS.includes(uploadData.bucket)) {
      return new Response(
        JSON.stringify({ error: 'Invalid bucket' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get bucket limits
    const bucketLimits = BUCKET_LIMITS[uploadData.bucket as keyof typeof BUCKET_LIMITS]

    // Validate content type
    if (!bucketLimits.allowed_types.includes(uploadData.content_type)) {
      return new Response(
        JSON.stringify({ error: 'File type not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decode base64 file data
    const fileData = Uint8Array.from(atob(uploadData.file_data), c => c.charCodeAt(0))

    // Validate file size
    if (fileData.length > bucketLimits.max_size) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's subscription status and validate limits
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, subscription_status')
      .eq('auth_user_id', userId)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check subscription limits for free users
    if (userData.subscription_status === 'free') {
      const limitCheck = await checkUploadLimits(supabaseClient, userId, uploadData.bucket, fileData.length)
      if (!limitCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Upload limit exceeded',
            message: limitCheck.message,
            upgrade_required: true
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Generate file path
    const timestamp = Date.now()
    const fileExtension = uploadData.filename.split('.').pop()
    const sanitizedFilename = `${timestamp}_${uploadData.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = uploadData.folder 
      ? `${userId}/${uploadData.folder}/${sanitizedFilename}`
      : `${userId}/${sanitizedFilename}`

    // Resize image if requested and it's an image
    let processedFileData = fileData
    if (uploadData.resize && uploadData.content_type.startsWith('image/')) {
      processedFileData = await resizeImage(fileData, uploadData.resize, uploadData.content_type)
    }

    // Upload to Supabase Storage
    const { data: uploadResult, error: uploadError } = await supabaseClient.storage
      .from(uploadData.bucket)
      .upload(filePath, processedFileData, {
        contentType: uploadData.content_type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL for public buckets
    let publicUrl = null
    if (['pet-photos', 'user-avatars', 'lost-pet-photos'].includes(uploadData.bucket)) {
      const { data: urlData } = supabaseClient.storage
        .from(uploadData.bucket)
        .getPublicUrl(filePath)
      publicUrl = urlData.publicUrl
    }

    // Record file in database
    const { data: fileRecord, error: fileError } = await supabaseClient
      .from('files')
      .insert({
        user_id: userData.id,
        filename: sanitizedFilename,
        original_filename: uploadData.filename,
        content_type: uploadData.content_type,
        file_size: processedFileData.length,
        storage_path: filePath,
        bucket_name: uploadData.bucket,
        is_public: ['pet-photos', 'user-avatars', 'lost-pet-photos'].includes(uploadData.bucket)
      })
      .select()
      .single()

    if (fileError) {
      console.error('File record error:', fileError)
      // Clean up uploaded file
      await supabaseClient.storage.from(uploadData.bucket).remove([filePath])
      return new Response(
        JSON.stringify({ error: 'Failed to record file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        data: {
          ...fileRecord,
          public_url: publicUrl,
          signed_url: !publicUrl ? await getSignedUrl(supabaseClient, uploadData.bucket, filePath) : null
        },
        message: 'File uploaded successfully' 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('File upload error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to upload file' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleFileDelete(supabaseClient: any, userId: string, searchParams: URLSearchParams) {
  try {
    const fileId = searchParams.get('file_id')
    const bucket = searchParams.get('bucket')
    const path = searchParams.get('path')

    if (!fileId && (!bucket || !path)) {
      return new Response(
        JSON.stringify({ error: 'File ID or bucket/path required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let filePath = path
    let bucketName = bucket

    // If using file ID, get path from database
    if (fileId) {
      const { data: fileData, error: fileError } = await supabaseClient
        .from('files')
        .select('storage_path, bucket_name')
        .eq('id', fileId)
        .single()

      if (fileError || !fileData) {
        return new Response(
          JSON.stringify({ error: 'File not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      filePath = fileData.storage_path
      bucketName = fileData.bucket_name
    }

    // Verify user owns the file (path starts with user ID)
    if (!filePath?.startsWith(userId)) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete from storage
    const { error: deleteError } = await supabaseClient.storage
      .from(bucketName)
      .remove([filePath])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete file from storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete from database if file ID provided
    if (fileId) {
      await supabaseClient
        .from('files')
        .delete()
        .eq('id', fileId)
    }

    return new Response(
      JSON.stringify({ message: 'File deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('File delete error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete file' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function checkUploadLimits(supabaseClient: any, userId: string, bucket: string, fileSize: number) {
  try {
    // Check total storage usage for free users (50MB limit)
    const { data: files, error } = await supabaseClient
      .from('files')
      .select('file_size')
      .eq('user_id', (await getUserId(supabaseClient, userId)))

    if (error) {
      return { allowed: false, message: 'Error checking storage limits' }
    }

    const totalUsage = files?.reduce((sum: number, file: any) => sum + (file.file_size || 0), 0) || 0
    const maxStorage = 50 * 1024 * 1024 // 50MB

    if (totalUsage + fileSize > maxStorage) {
      return { 
        allowed: false, 
        message: `Storage limit exceeded. Free plan allows 50MB total storage. Current usage: ${Math.round(totalUsage / 1024 / 1024)}MB` 
      }
    }

    return { allowed: true, message: 'Upload allowed' }
  } catch (error) {
    return { allowed: false, message: 'Error checking limits' }
  }
}

async function getUserId(supabaseClient: any, authUserId: string) {
  const { data } = await supabaseClient
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single()
  return data?.id
}

async function getSignedUrl(supabaseClient: any, bucket: string, path: string) {
  try {
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, 3600) // 1 hour expiry
    
    return error ? null : data.signedUrl
  } catch {
    return null
  }
}

// Simple image resizing function (placeholder - would need proper image processing library)
async function resizeImage(
  imageData: Uint8Array, 
  resize: { width: number; height: number; quality?: number },
  contentType: string
): Promise<Uint8Array> {
  // This is a placeholder implementation
  // In a real implementation, you would use a proper image processing library
  // For now, just return the original data
  console.log(`Resize requested: ${resize.width}x${resize.height}, quality: ${resize.quality || 80}`)
  return imageData
}