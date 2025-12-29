/**
 * Create Pet Modal Component
 * Admin modal to create new pets and assign to users
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, PawPrint, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CreatePetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserOption {
  id: string;
  email: string;
  name: string;
}

interface CreatePetFormData {
  name: string;
  species: string;
  breed: string;
  gender: string;
  dateOfBirth: string;
  weightKg: string;
  ownerId: string;
}

export const CreatePetModal = ({ isOpen, onClose, onSuccess }: CreatePetModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [formData, setFormData] = useState<CreatePetFormData>({
    name: '',
    species: 'dog',
    breed: '',
    gender: '',
    dateOfBirth: '',
    weightKg: '',
    ownerId: '',
  });

  // Fetch users for owner selection
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen) return;

      setIsLoadingUsers(true);
      try {
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('auth_user_id, email, first_name, last_name')
          .order('email');

        if (fetchError) throw fetchError;

        if (data) {
          setUsers(
            data.map((u) => ({
              id: u.auth_user_id,
              email: u.email,
              name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ownerId) {
      setError('Please select an owner');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { error: insertError } = await supabase.from('pets').insert({
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        gender: formData.gender || null,
        date_of_birth: formData.dateOfBirth || null,
        weight_kg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        user_id: formData.ownerId,
        status: 'active',
      });

      if (insertError) throw insertError;

      // Reset form and close modal
      setFormData({
        name: '',
        species: 'dog',
        breed: '',
        gender: '',
        dateOfBirth: '',
        weightKg: '',
        ownerId: '',
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error creating pet:', err);
      setError(err instanceof Error ? err.message : 'Failed to create pet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create New Pet</h2>
              <p className="text-sm text-slate-500">Add a new pet to the system</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Pet Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pet Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Buddy"
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50"
            />
          </div>

          {/* Owner Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Owner *
            </label>
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-500">Loading users...</span>
              </div>
            ) : (
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                required
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-slate-50"
              >
                <option value="">Select owner...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Species and Breed */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Species *
              </label>
              <select
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-slate-50"
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="fish">Fish</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Breed
              </label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="Golden Retriever"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Gender and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-slate-50"
              >
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                placeholder="10.5"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isLoadingUsers}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PawPrint className="h-4 w-4" />
                  Create Pet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
