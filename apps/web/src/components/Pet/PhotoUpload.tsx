/**
 * PhotoUpload Component
 * Handles pet photo uploads with drag-and-drop support
 * Uses subscription-aware limits that update in real-time
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadPetPhoto, getPhotoLimits } from '@tailtracker/shared-services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';

interface PhotoUploadProps {
  petId: string;
  onUploadComplete?: () => void;
}

export const PhotoUpload = ({ petId, onUploadComplete }: PhotoUploadProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Get subscription to track tier changes
  const { tier } = useSubscription();

  // Get photo limits - refetches when tier changes
  const { data: limits, isLoading: limitsLoading } = useQuery({
    queryKey: ['photoLimits', petId, tier],
    queryFn: () => getPhotoLimits(petId),
    // Ensure fresh data when tier changes
    staleTime: 0,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await uploadPetPhoto(petId, file, false);
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petPhotos', petId] });
      // Include tier in query key to match our query definition
      queryClient.invalidateQueries({ queryKey: ['photoLimits', petId, tier] });
      queryClient.invalidateQueries({ queryKey: ['pet', petId] });
      setSelectedFile(null);
      setPreview(null);
      setError(null);
      onUploadComplete?.();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Upload failed');
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canUpload = limits?.canUpload ?? false;
  const isUploading = uploadMutation.isPending;

  // Show limit reached message
  if (!limitsLoading && limits && !canUpload && !selectedFile) {
    return (
      <div className="border-2 border-dashed border-amber-200 rounded-xl p-6 bg-amber-50">
        <div className="flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Photo limit reached</p>
            <p className="text-sm text-amber-600">
              You have {limits.current}/{limits.max} photos. Upgrade your plan to add more.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show preview and upload button
  if (preview && selectedFile) {
    return (
      <div className="border-2 border-slate-200 rounded-xl p-4 bg-white">
        <div className="flex items-start gap-4">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate">{selectedFile.name}</p>
            <p className="text-sm text-slate-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${isUploading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600'}
              `}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show dropzone
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all
        ${isDragging
          ? 'border-primary-400 bg-primary-50'
          : 'border-slate-200 bg-slate-50 hover:border-primary-300 hover:bg-primary-50/50'}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
          <ImageIcon className={`w-6 h-6 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
        </div>
        <p className="font-medium text-slate-700">
          {isDragging ? 'Drop image here' : 'Drop an image or click to upload'}
        </p>
        <p className="text-sm text-slate-500 mt-1">
          JPEG, PNG, GIF, or WebP up to 5MB
        </p>
        {limits && (
          <p className="text-xs text-slate-400 mt-2">
            {limits.current}/{limits.max} photos used
          </p>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 text-center mt-3">{error}</p>
      )}
    </div>
  );
};
