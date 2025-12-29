/**
 * Admin Ads & Promotions Tab
 * Manage ads and promo codes
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Megaphone,
  Tag,
  Eye,
  MousePointer,
  Calendar,
  CheckCircle,
  XCircle,
  Percent,
  DollarSign,
} from 'lucide-react';
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  logAdminAction,
} from '@tailtracker/shared-services';
import type { Ad, PromoCode, AdPlacement, AdTargetAudience, DiscountType, SubscriptionTier } from '@tailtracker/shared-types';

type TabType = 'ads' | 'promos';

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Ad Form Modal
interface AdFormProps {
  ad?: Ad | null;
  onSave: (data: Partial<Ad>) => void;
  onCancel: () => void;
  isPending: boolean;
}

const AdForm = ({ ad, onSave, onCancel, isPending }: AdFormProps) => {
  const [formData, setFormData] = useState({
    title: ad?.title || '',
    description: ad?.description || '',
    imageUrl: ad?.imageUrl || '',
    linkUrl: ad?.linkUrl || '',
    placement: ad?.placement || 'dashboard' as AdPlacement,
    targetAudience: ad?.targetAudience || 'all' as AdTargetAudience,
    startDate: ad?.startDate?.split('T')[0] || '',
    endDate: ad?.endDate?.split('T')[0] || '',
    isActive: ad?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {ad ? 'Edit Ad' : 'Create New Ad'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Link URL</label>
              <input
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Placement</label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value as AdPlacement })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="dashboard">Dashboard</option>
                <option value="pets_page">Pets Page</option>
                <option value="settings">Settings</option>
                <option value="sidebar">Sidebar</option>
                <option value="modal">Modal</option>
                <option value="banner">Banner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as AdTargetAudience })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Users</option>
                <option value="free_users">Free Users</option>
                <option value="premium_users">Premium Users</option>
                <option value="pro_users">Pro Users</option>
                <option value="new_users">New Users</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {ad ? 'Update Ad' : 'Create Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Promo Code Form Modal
interface PromoFormProps {
  promo?: PromoCode | null;
  onSave: (data: Partial<PromoCode>) => void;
  onCancel: () => void;
  isPending: boolean;
}

const PromoForm = ({ promo, onSave, onCancel, isPending }: PromoFormProps) => {
  const [formData, setFormData] = useState({
    code: promo?.code || '',
    discountType: promo?.discountType || 'percentage' as DiscountType,
    discountValue: promo?.discountValue || 0,
    expirationDate: promo?.expirationDate?.split('T')[0] || '',
    usageLimit: promo?.usageLimit || 0,
    minPurchaseAmount: promo?.minPurchaseAmount || 0,
    applicablePlans: promo?.applicablePlans || ['premium', 'pro'] as SubscriptionTier[],
    isActive: promo?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      expirationDate: formData.expirationDate || undefined,
      usageLimit: formData.usageLimit || undefined,
      minPurchaseAmount: formData.minPurchaseAmount || undefined,
    });
  };

  const togglePlan = (plan: SubscriptionTier) => {
    setFormData((prev) => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(plan)
        ? prev.applicablePlans.filter((p) => p !== plan)
        : [...prev.applicablePlans, plan],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {promo ? 'Edit Promo Code' : 'Create New Promo Code'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER2025"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discount Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step={formData.discountType === 'percentage' ? '1' : '0.01'}
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {formData.discountType === 'percentage' ? '%' : '$'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usage Limit</label>
              <input
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                placeholder="0 = unlimited"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Purchase Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minPurchaseAmount}
                onChange={(e) => setFormData({ ...formData, minPurchaseAmount: Number(e.target.value) })}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Applicable Plans</label>
            <div className="flex gap-2">
              {(['free', 'premium', 'pro'] as SubscriptionTier[]).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => togglePlan(plan)}
                  className={`px-3 py-1.5 text-sm rounded-lg capitalize ${
                    formData.applicablePlans.includes(plan)
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {promo ? 'Update Code' : 'Create Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdsTab = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('ads');
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Ads queries
  const { data: ads, isLoading: loadingAds } = useQuery({
    queryKey: ['adminAds'],
    queryFn: getAds,
    enabled: activeTab === 'ads',
  });

  const createAdMutation = useMutation({
    mutationFn: createAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAds'] });
      setShowAdForm(false);
      logAdminAction('create_ad', 'ad', '');
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ad> }) => updateAd(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['adminAds'] });
      setEditingAd(null);
      logAdminAction('update_ad', 'ad', id);
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: deleteAd,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminAds'] });
      logAdminAction('delete_ad', 'ad', id);
    },
  });

  // Promo codes queries
  const { data: promos, isLoading: loadingPromos } = useQuery({
    queryKey: ['adminPromoCodes'],
    queryFn: getPromoCodes,
    enabled: activeTab === 'promos',
  });

  const createPromoMutation = useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPromoCodes'] });
      setShowPromoForm(false);
      logAdminAction('create_promo_code', 'promo_code', '');
    },
  });

  const updatePromoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromoCode> }) =>
      updatePromoCode(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['adminPromoCodes'] });
      setEditingPromo(null);
      logAdminAction('update_promo_code', 'promo_code', id);
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: deletePromoCode,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminPromoCodes'] });
      logAdminAction('delete_promo_code', 'promo_code', id);
    },
  });

  const handleDeleteAd = (ad: Ad) => {
    if (window.confirm(`Are you sure you want to delete "${ad.title}"?`)) {
      deleteAdMutation.mutate(ad.id);
    }
  };

  const handleDeletePromo = (promo: PromoCode) => {
    if (window.confirm(`Are you sure you want to delete promo code "${promo.code}"?`)) {
      deletePromoMutation.mutate(promo.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ads'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            Ads
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'promos'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="h-4 w-4" />
            Promo Codes
          </button>
        </div>
        <button
          onClick={() => (activeTab === 'ads' ? setShowAdForm(true) : setShowPromoForm(true))}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'ads' ? 'Create Ad' : 'Create Promo Code'}
        </button>
      </div>

      {/* Ads List */}
      {activeTab === 'ads' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loadingAds ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : !ads || ads.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No ads created yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ads.map((ad) => (
                <div key={ad.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900">{ad.title}</h4>
                        {ad.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      {ad.description && (
                        <p className="text-sm text-slate-600 mt-1">{ad.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 capitalize">
                          <Tag className="h-3 w-3" />
                          {ad.placement.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          Target: {ad.targetAudience.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {ad.impressions.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          {ad.clicks.toLocaleString()}
                        </span>
                        {ad.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(ad.startDate)} - {formatDate(ad.endDate ?? null)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAd(ad)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAd(ad)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Promo Codes List */}
      {activeTab === 'promos' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loadingPromos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : !promos || promos.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No promo codes created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Expires
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {promos.map((promo) => (
                    <tr key={promo.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-slate-900">{promo.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-sm">
                          {promo.discountType === 'percentage' ? (
                            <>
                              <Percent className="h-4 w-4 text-green-500" />
                              {promo.discountValue}%
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 text-green-500" />
                              {formatCurrency(promo.discountValue)}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">
                          {promo.timesUsed} / {promo.usageLimit || '∞'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-500">
                          {formatDate(promo.expirationDate ?? null)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {promo.isActive ? (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingPromo(promo)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(promo)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Ad Form Modal */}
      {(showAdForm || editingAd) && (
        <AdForm
          ad={editingAd}
          onSave={(data) =>
            editingAd
              ? updateAdMutation.mutate({ id: editingAd.id, data })
              : createAdMutation.mutate(data as Parameters<typeof createAd>[0])
          }
          onCancel={() => {
            setShowAdForm(false);
            setEditingAd(null);
          }}
          isPending={createAdMutation.isPending || updateAdMutation.isPending}
        />
      )}

      {/* Promo Form Modal */}
      {(showPromoForm || editingPromo) && (
        <PromoForm
          promo={editingPromo}
          onSave={(data) =>
            editingPromo
              ? updatePromoMutation.mutate({ id: editingPromo.id, data })
              : createPromoMutation.mutate(data as Parameters<typeof createPromoCode>[0])
          }
          onCancel={() => {
            setShowPromoForm(false);
            setEditingPromo(null);
          }}
          isPending={createPromoMutation.isPending || updatePromoMutation.isPending}
        />
      )}
    </div>
  );
};
