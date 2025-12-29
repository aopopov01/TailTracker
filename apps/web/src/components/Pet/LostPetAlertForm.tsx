/**
 * Lost Pet Alert Form Component
 * Form for Pro members to create lost pet alerts with location pinning
 */

import { useState, useCallback, useRef } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Euro,
  AlertTriangle,
  Clock,
  FileText,
  Loader2,
  Circle,
  RotateCcw,
  Camera,
  Check,
  X,
  Upload,
} from 'lucide-react';
import type {
  LostPetAlertFormData,
  GeoCoordinates,
  Pet,
} from '@tailtracker/shared-types';
import { LostPetLocationPicker } from './LostPetLocationPicker';

interface LostPetAlertFormProps {
  pet: Pet;
  onSubmit: (data: LostPetAlertFormData & { selectedPhotos?: string[] }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ALERT_RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
];

// Helper to format date for datetime-local input (local timezone)
const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Get current date/time in datetime-local format
const getCurrentDateTime = (): string => formatDateTimeLocal(new Date());

export const LostPetAlertForm = ({
  pet,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LostPetAlertFormProps) => {
  const [formData, setFormData] = useState<Partial<LostPetAlertFormData>>({
    petId: pet.id,
    lastSeenDate: new Date(),
    alertRadius: 5000,
    contactPhone: '',
    contactEmail: '',
    description: '',
    additionalInfo: '',
    rewardAmount: undefined,
  });

  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [address, setAddress] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Image selection state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get pet's existing photos
  const petPhotos = pet.photos || [];

  // Handle location selection from the map picker
  const handleLocationSelect = useCallback((coords: GeoCoordinates, selectedAddress: string) => {
    setLocation(coords);
    setAddress(selectedAddress);
    // Clear location error if set
    if (errors.location) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  }, [errors.location]);

  // Image selection handlers
  const toggleImageSelection = (imageUrl: string) => {
    if (selectedImages.includes(imageUrl)) {
      setSelectedImages(prev => prev.filter(img => img !== imageUrl));
    } else if (selectedImages.length + uploadedImages.length < 3) {
      setSelectedImages(prev => [...prev, imageUrl]);
    }
    // Clear image error if set
    if (errors.images) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const removeUploadedImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(img => img !== imageUrl));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, images: 'Image must be less than 5MB' }));
      return;
    }

    if (selectedImages.length + uploadedImages.length >= 3) {
      setErrors(prev => ({ ...prev, images: 'Maximum 3 images allowed' }));
      return;
    }

    setIsUploadingImage(true);
    try {
      // Create a preview URL for now (actual upload would happen on submit)
      const previewUrl = URL.createObjectURL(file);
      setUploadedImages(prev => [...prev, previewUrl]);

      // Clear any image errors
      if (errors.images) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.images;
          return newErrors;
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrors(prev => ({ ...prev, images: 'Failed to upload image' }));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!location) {
      newErrors.location = 'Location is required. Please set a location or enter an address.';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Please describe when and how your pet went missing.';
    }

    if (!formData.contactPhone?.trim() && !formData.contactEmail?.trim()) {
      newErrors.contact = 'Please provide at least one way for people to contact you.';
    }

    if (formData.contactEmail?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address.';
      }
    }

    if (selectedImages.length + uploadedImages.length === 0) {
      newErrors.images = 'Please select at least one photo to help identify your pet.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !location) return;

    await onSubmit({
      petId: pet.id,
      lastSeenDate: formData.lastSeenDate || new Date(),
      lastSeenLocation: location,
      lastSeenAddress: address || undefined,
      description: formData.description || '',
      additionalInfo: formData.additionalInfo,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      rewardAmount: formData.rewardAmount,
      alertRadius: formData.alertRadius,
      selectedPhotos: [...selectedImages, ...uploadedImages],
    });
  };

  const updateFormData = <K extends keyof LostPetAlertFormData>(
    field: K,
    value: LostPetAlertFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    const fieldKey = field as string;
    if (errors[fieldKey]) {
      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  // Check if form is valid for enabling submit button
  const isFormValid = location &&
    formData.description?.trim() &&
    (formData.contactPhone?.trim() || formData.contactEmail?.trim()) &&
    (selectedImages.length + uploadedImages.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pet Info Banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800">Report {pet.name} as Lost</h3>
            <p className="text-sm text-red-600">
              This will send alerts to nearby TailTracker users
            </p>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <MapPin className="inline h-4 w-4 mr-1" />
          Last Seen Location *
        </label>

        {/* Location Picker with Map */}
        <LostPetLocationPicker
          onLocationSelect={handleLocationSelect}
          initialLocation={location}
          initialAddress={address}
        />

        {errors.location && (
          <p className="text-sm text-red-600">{errors.location}</p>
        )}
      </div>

      {/* Date/Time */}
      <div className="space-y-2">
        <label htmlFor="lastSeenDate" className="block text-sm font-medium text-gray-700">
          <Clock className="inline h-4 w-4 mr-1" />
          Last Seen Date & Time *
        </label>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            id="lastSeenDate"
            value={formData.lastSeenDate ? formatDateTimeLocal(formData.lastSeenDate) : ''}
            onChange={(e) => updateFormData('lastSeenDate', new Date(e.target.value))}
            max={getCurrentDateTime()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
          <button
            type="button"
            onClick={() => updateFormData('lastSeenDate', new Date())}
            className="px-3 py-2 text-sm border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 flex items-center gap-1"
            title="Set to current time"
          >
            <RotateCcw className="h-4 w-4" />
            Now
          </button>
        </div>
        <p className="text-xs text-gray-500">When did you last see your pet?</p>
      </div>

      {/* Pet Photos Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <Camera className="inline h-4 w-4 mr-1" />
          Pet Photos for Alert *
        </label>
        <p className="text-xs text-gray-500">Select up to 3 photos to help identify your pet</p>

        {/* Existing Pet Photos */}
        {petPhotos && petPhotos.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-2">Select from existing photos:</p>
            <div className="flex flex-wrap gap-2">
              {petPhotos.map((photo, index) => {
                // Ensure photo URL is valid - handle both full URLs and storage paths
                const photoUrl = photo.startsWith('http')
                  ? photo
                  : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/pet-photos/${photo}`;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleImageSelection(photoUrl)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImages.includes(photoUrl)
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={photoUrl}
                      alt={`Pet photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).src = '/images/pets/logo.png';
                      }}
                    />
                    {selectedImages.includes(photoUrl) && (
                      <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Uploaded Photos */}
        <div>
          <p className="text-xs text-gray-600 mb-2">
            {petPhotos.length > 0 ? 'Or upload a new photo:' : 'Upload photos:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Preview uploaded images */}
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary-500">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeUploadedImage(img)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}

            {/* Upload button */}
            {selectedImages.length + uploadedImages.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span className="text-xs mt-1">Upload</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Selected count */}
        <p className="text-xs text-gray-500">
          {selectedImages.length + uploadedImages.length}/3 photos selected
          {selectedImages.length + uploadedImages.length === 0 && (
            <span className="text-red-500 ml-1">(at least 1 required)</span>
          )}
        </p>
        {errors.images && (
          <p className="text-sm text-red-600">{errors.images}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          <FileText className="inline h-4 w-4 mr-1" />
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Describe when and how your pet went missing. Include any distinctive features or behavior..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Alert Radius */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <Circle className="inline h-4 w-4 mr-1" />
          Alert Radius
        </label>
        <p className="text-xs text-gray-500">
          Users within this distance will receive notifications
        </p>
        <div className="flex flex-wrap gap-2">
          {ALERT_RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateFormData('alertRadius', option.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                formData.alertRadius === option.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400 hover:text-primary-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Contact Information *</h4>
        <p className="text-xs text-gray-500">
          Provide at least one way for people to contact you
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="contactPhone" className="block text-sm text-gray-600">
              <Phone className="inline h-4 w-4 mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={formData.contactPhone || ''}
              onChange={(e) => updateFormData('contactPhone', e.target.value)}
              placeholder="+1 234 567 8900"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="contactEmail" className="block text-sm text-gray-600">
              <Mail className="inline h-4 w-4 mr-1" />
              Email Address
            </label>
            <input
              type="email"
              id="contactEmail"
              value={formData.contactEmail || ''}
              onChange={(e) => updateFormData('contactEmail', e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.contactEmail && (
              <p className="text-sm text-red-600">{errors.contactEmail}</p>
            )}
          </div>
        </div>
        {errors.contact && (
          <p className="text-sm text-red-600">{errors.contact}</p>
        )}
      </div>

      {/* Reward (Optional) */}
      <div className="space-y-2">
        <label htmlFor="rewardAmount" className="block text-sm font-medium text-gray-700">
          <Euro className="inline h-4 w-4 mr-1" />
          Reward Amount (Optional)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">EUR</span>
          <input
            type="number"
            id="rewardAmount"
            value={formData.rewardAmount || ''}
            onChange={(e) => updateFormData('rewardAmount', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            min="0"
            step="1"
            className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2">
        <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
          Additional Information (Optional)
        </label>
        <textarea
          id="additionalInfo"
          value={formData.additionalInfo || ''}
          onChange={(e) => updateFormData('additionalInfo', e.target.value)}
          placeholder="Any other details that might help find your pet..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Alert...
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              Create Lost Pet Alert
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default LostPetAlertForm;
