/**
 * Digital Passport Page
 * Full-page view of pet's digital passport/ID card
 */

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { DigitalPassport } from '@/components/Pet';

export const DigitalPassportPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Pet not found
        </h2>
        <p className="text-gray-600 mb-4">
          No pet ID provided.
        </p>
        <Link to="/pets" className="btn-primary">
          Back to My Pets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/pets/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pet Profile
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Passport</h1>
            <p className="text-gray-600">
              Tap the card to see health & care details
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-outline"
              onClick={() => {
                // TODO: Implement share functionality
                if (navigator.share) {
                  navigator.share({
                    title: 'Pet Digital Passport',
                    text: 'Check out my pet\'s digital passport!',
                    url: window.location.href,
                  });
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Passport Card */}
      <div className="py-8">
        <DigitalPassport petId={id} />
      </div>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-primary-50 rounded-xl border border-primary-100">
        <h3 className="font-semibold text-primary-900 mb-2">
          About Digital Passports
        </h3>
        <p className="text-sm text-primary-700">
          Your pet's digital passport contains important identification and health information.
          Share it with veterinarians, pet sitters, or boarding facilities for quick access
          to your pet's essential details.
        </p>
      </div>
    </div>
  );
};
