/**
 * Digital Passport Component
 * Professional pet ID card with flip animation
 * Front: Photo, name, breed, DOB, owner
 * Back: Microchip, emergency contact, medical info
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  RotateCcw,
  Loader2,
  Cpu,
  Phone,
  User,
  Mail,
  AlertTriangle,
  Pill,
} from 'lucide-react';
import { getPetById, getPetPhotos } from '@tailtracker/shared-services';
import { calculateAge } from '@tailtracker/shared-utils';
import { useAuthStore } from '@/stores/authStore';

interface DigitalPassportProps {
  petId: string;
  compact?: boolean;
}

// Get species-specific default image path
const getSpeciesImage = (species: string): string => {
  switch (species?.toLowerCase()) {
    case 'dog':
      return '/images/pets/dog.png';
    case 'cat':
      return '/images/pets/cat.png';
    case 'bird':
      return '/images/pets/bird.png';
    default:
      return '/images/pets/logo.png';
  }
};

export const DigitalPassport = ({ petId, compact = false }: DigitalPassportProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { user } = useAuthStore();

  // Fetch pet data
  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => getPetById(petId),
    enabled: !!petId,
  });

  // Fetch photos for profile photo
  const { data: photos = [] } = useQuery({
    queryKey: ['petPhotos', petId],
    queryFn: () => getPetPhotos(petId),
    enabled: !!petId,
  });

  const profilePhoto = photos.find((p) => p.isProfilePhoto) || photos[0];

  if (petLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="text-center py-8 text-gray-500">
        Pet not found
      </div>
    );
  }

  const age = pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : null;
  const petImage = profilePhoto ? profilePhoto.url : getSpeciesImage(pet.species);

  // Card dimensions (credit card ratio: 85.6mm x 53.98mm ≈ 1.586:1)
  const cardWidth = compact ? 'w-80' : 'w-96';
  const cardHeight = compact ? 'h-[201px]' : 'h-[241px]';

  return (
    <div className="space-y-4">
      {/* Card Container with perspective */}
      <div
        className={`perspective-1000 ${cardWidth} mx-auto cursor-pointer`}
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1000px' }}
      >
        <div
          className={`relative ${cardHeight} transition-transform duration-700`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Side */}
          <div
            className={`absolute inset-0 ${cardHeight} rounded-2xl overflow-hidden shadow-xl`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700" />

            {/* Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-1.5 0-2.7 1.2-2.7 2.7 0 .5.1 1 .4 1.4L25 12c-.3-.2-.6-.3-.9-.3-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7c.3 0 .6-.1.9-.2l2.7 2.9c-.3.4-.4.9-.4 1.4 0 1.5 1.2 2.7 2.7 2.7s2.7-1.2 2.7-2.7c0-.5-.1-1-.4-1.4l2.7-2.9c.3.1.6.2.9.2 1.5 0 2.7-1.2 2.7-2.7s-1.2-2.7-2.7-2.7c-.3 0-.6.1-.9.3l-2.7-2.9c.3-.4.4-.9.4-1.4C32.7 6.2 31.5 5 30 5z' fill='%23ffffff' fill-opacity='0.4'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Content */}
            <div className="relative h-full p-4 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white/90">TailTracker Pet ID</span>
                </div>
                <div className="text-xs text-white/60 flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Tap to flip
                </div>
              </div>

              {/* Main Content */}
              <div className="flex items-center gap-4 flex-1">
                {/* Pet Photo */}
                <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white shadow-lg ring-2 ring-white/30">
                  <img
                    src={petImage}
                    alt={pet.name}
                    className={profilePhoto ? 'w-full h-full object-cover' : 'w-full h-full object-contain p-2'}
                  />
                </div>

                {/* Pet Info */}
                <div className="flex-1 min-w-0 text-white">
                  <h3 className="text-xl font-bold truncate">{pet.name}</h3>
                  {pet.breed && (
                    <p className="text-white/80 text-sm truncate">{pet.breed}</p>
                  )}
                  <p className="text-white/70 text-sm capitalize">{pet.species}</p>
                  {age && (
                    <p className="text-white/70 text-sm mt-1">
                      {age} old
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/20">
                <div className="text-xs text-white/70">
                  <span className="font-medium text-white/90">Owner:</span> {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'N/A'}
                </div>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-medium capitalize
                  ${pet.status === 'active' ? 'bg-green-400/20 text-green-100 ring-1 ring-green-400/30' : ''}
                  ${pet.status === 'lost' ? 'bg-red-400/20 text-red-100 ring-1 ring-red-400/30' : ''}
                  ${pet.status === 'deceased' ? 'bg-gray-400/20 text-gray-100 ring-1 ring-gray-400/30' : ''}
                `}>
                  {pet.status}
                </span>
              </div>
            </div>
          </div>

          {/* Back Side */}
          <div
            className={`absolute inset-0 ${cardHeight} rounded-2xl overflow-hidden bg-white shadow-xl`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Content */}
            <div className="h-full p-3 flex flex-col">
              {/* Header with tap to flip */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Emergency Info</span>
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <RotateCcw className="h-2.5 w-2.5" />
                  Tap to flip
                </div>
              </div>

              {/* Two-section layout */}
              <div className="flex-1 flex flex-col gap-2">
                {/* SECTION 1: Emergency Contact */}
                <div className="flex-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <User className="h-3 w-3 text-slate-500" />
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">Emergency Contact</span>
                  </div>

                  {pet.emergencyContact?.name || pet.emergencyContact?.phone || pet.emergencyContact?.email ? (
                    <div className="space-y-0.5 text-xs">
                      {pet.emergencyContact.name && (
                        <p className="text-slate-800 font-medium truncate">{pet.emergencyContact.name}</p>
                      )}
                      {pet.emergencyContact.phone && (
                        <a
                          href={`tel:${pet.emergencyContact.phone}`}
                          className="flex items-center gap-1 text-primary-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="h-2.5 w-2.5" />
                          <span>{pet.emergencyContact.phone}</span>
                        </a>
                      )}
                      {pet.emergencyContact.email && (
                        <a
                          href={`mailto:${pet.emergencyContact.email}`}
                          className="flex items-center gap-1 text-slate-600 hover:underline truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-2.5 w-2.5" />
                          <span className="truncate">{pet.emergencyContact.email}</span>
                        </a>
                      )}
                    </div>
                  ) : user?.email ? (
                    <div className="text-xs">
                      <p className="text-slate-500 text-[10px] mb-0.5">Owner</p>
                      <a
                        href={`mailto:${user.email}`}
                        className="flex items-center gap-1 text-slate-600 hover:underline truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-2.5 w-2.5" />
                        <span className="truncate">{user.email}</span>
                      </a>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">No contact on file</p>
                  )}
                </div>

                {/* SECTION 2: Critical Medical Alert */}
                {(pet.allergies?.length || pet.medicalConditions?.length || pet.currentMedications?.length) ? (
                  <div className="flex-1 p-2 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-[10px] font-medium text-red-600 uppercase tracking-wide">Medical Alert</span>
                    </div>

                    <div className="space-y-0.5 text-[10px]">
                      {pet.allergies && pet.allergies.length > 0 && (
                        <p className="text-red-700 line-clamp-1" title={pet.allergies.join(', ')}>
                          <span className="font-medium">Allergies:</span> {pet.allergies.join(', ')}
                        </p>
                      )}
                      {pet.medicalConditions && pet.medicalConditions.length > 0 && (
                        <p className="text-red-700 line-clamp-1" title={pet.medicalConditions.map((c) => c.name).join(', ')}>
                          <span className="font-medium">Conditions:</span>{' '}
                          {pet.medicalConditions.map((c) => c.name).join(', ')}
                        </p>
                      )}
                      {pet.currentMedications && pet.currentMedications.length > 0 && (
                        <p className="text-blue-700 line-clamp-1" title={pet.currentMedications.map((m) => typeof m === 'string' ? m : m.name).join(', ')}>
                          <Pill className="h-2.5 w-2.5 inline mr-0.5" />
                          <span className="font-medium">Meds:</span>{' '}
                          {pet.currentMedications.map((m) => typeof m === 'string' ? m : m.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-2 bg-green-50 rounded-lg border border-green-100 flex items-center justify-center">
                    <p className="text-[10px] text-green-600">No known medical conditions</p>
                  </div>
                )}
              </div>

              {/* Microchip in footer if available */}
              {pet.microchipNumber && (
                <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center gap-1">
                  <Cpu className="h-2.5 w-2.5 text-slate-400" />
                  <span className="text-[9px] text-slate-500">Chip:</span>
                  <span className="text-[9px] font-mono text-slate-700">{pet.microchipNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
