/**
 * DocumentUpload Component
 * Handles immediate file upload on selection with visual feedback
 * Supports viewing, downloading, and removing documents
 */

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  X,
  Loader2,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { getSupabaseClient } from '@tailtracker/shared-services';

const STORAGE_BUCKET = 'pet-documents';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export interface DocumentMetadata {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

interface UploadingFile {
  file: File;
  progress: 'uploading' | 'success' | 'error';
  errorMessage?: string;
  metadata?: DocumentMetadata;
}

interface DocumentUploadProps {
  /** User ID for storage path */
  userId: string;
  /** Pet ID for storage path */
  petId: string;
  /** Record ID (vaccination or medical record) */
  recordId?: string;
  /** Type of record for path organization */
  recordType: 'vaccination' | 'medical-record';
  /** Existing documents to display */
  documents: DocumentMetadata[];
  /** Callback when documents change */
  onDocumentsChange: (documents: DocumentMetadata[]) => void;
  /** Optional label for the upload area */
  label?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentUpload = ({
  userId,
  petId,
  recordId,
  recordType,
  documents,
  onDocumentsChange,
  label = 'Documents',
  disabled = false,
}: DocumentUploadProps) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<DocumentMetadata | null> => {
      try {
        const supabase = getSupabaseClient();

        // Generate unique filename with timestamp and random ID
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const sanitizedName = file.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .substring(0, 50);
        const fileName = `${timestamp}-${randomId}-${sanitizedName}`;

        // Build storage path: userId/petId/recordType/recordId/filename
        const pathParts = [userId, petId, recordType];
        if (recordId) {
          pathParts.push(recordId);
        }
        pathParts.push(fileName);
        const filePath = pathParts.join('/');

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(uploadError.message);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        const metadata: DocumentMetadata = {
          filename: file.name,
          url: urlData?.publicUrl || filePath,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };

        return metadata;
      } catch (error) {
        console.error('File upload failed:', error);
        throw error;
      }
    },
    [userId, petId, recordId, recordType]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Validate files
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: File too large (max 10MB)`);
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push(`${file.name}: Invalid file type`);
          continue;
        }
        validFiles.push(file);
      }

      if (errors.length > 0) {
        console.warn('File validation errors:', errors);
      }

      // Add files to uploading state
      const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
        file,
        progress: 'uploading' as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      // Upload each file
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

        try {
          const metadata = await uploadFile(file);

          if (metadata) {
            // Update uploading state to success
            setUploadingFiles((prev) =>
              prev.map((uf) =>
                uf.file === file
                  ? { ...uf, progress: 'success' as const, metadata }
                  : uf
              )
            );

            // Add to documents
            onDocumentsChange([...documents, metadata]);

            // Remove from uploading after short delay
            setTimeout(() => {
              setUploadingFiles((prev) => prev.filter((uf) => uf.file !== file));
            }, 1500);
          }
        } catch (error) {
          // Update uploading state to error
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.file === file
                ? {
                    ...uf,
                    progress: 'error' as const,
                    errorMessage:
                      error instanceof Error ? error.message : 'Upload failed',
                  }
                : uf
            )
          );
        }
      }
    },
    [uploadFile, documents, onDocumentsChange]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const retryUpload = (uploadingFile: UploadingFile) => {
    // Remove the failed file and re-add it
    setUploadingFiles((prev) => prev.filter((uf) => uf !== uploadingFile));
    handleFiles([uploadingFile.file]);
  };

  const removeUploadingFile = (uploadingFile: UploadingFile) => {
    setUploadingFiles((prev) => prev.filter((uf) => uf !== uploadingFile));
  };

  const deleteDocument = async (doc: DocumentMetadata) => {
    setDeletingUrl(doc.url);

    try {
      const supabase = getSupabaseClient();

      // Extract path from URL
      const urlParts = doc.url.split(`${STORAGE_BUCKET}/`);
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      }

      // Remove from documents array
      onDocumentsChange(documents.filter((d) => d.url !== doc.url));
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeletingUrl(null);
    }
  };

  const openDocument = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Existing Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div
              key={doc.url || index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.size)}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => openDocument(doc.url)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View document"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteDocument(doc)}
                  disabled={deletingUrl === doc.url || disabled}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Remove document"
                >
                  {deletingUrl === doc.url ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uf, index) => (
            <div
              key={`${uf.file.name}-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                uf.progress === 'error'
                  ? 'bg-red-50 border-red-200'
                  : uf.progress === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText
                  className={`h-5 w-5 flex-shrink-0 ${
                    uf.progress === 'error'
                      ? 'text-red-600'
                      : uf.progress === 'success'
                        ? 'text-green-600'
                        : 'text-blue-600'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uf.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uf.file.size)}
                    {uf.progress === 'uploading' && ' - Uploading...'}
                    {uf.progress === 'success' && ' - Uploaded'}
                    {uf.progress === 'error' && ` - ${uf.errorMessage}`}
                  </p>
                </div>
                {uf.progress === 'uploading' && (
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                )}
                {uf.progress === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                {uf.progress === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              {uf.progress === 'error' && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => retryUpload(uf)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Retry upload"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeUploadingFile(uf)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        <Upload
          className={`h-8 w-8 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
        />
        <p className="text-sm text-gray-600">
          {isDragging ? (
            'Drop files here'
          ) : (
            <>
              <span className="font-medium text-blue-600">Click to upload</span>{' '}
              or drag and drop
            </>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, images (max 10MB each)
        </p>
      </div>
    </div>
  );
};

export default DocumentUpload;
