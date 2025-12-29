/**
 * Landing Page
 * Clean, modern, trustworthy design for TailTracker
 */

import { Link } from 'react-router-dom';
import {
  Heart,
  Shield,
  Bell,
  Users,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const features = [
  {
    name: 'Digital Pet Passport',
    description:
      'Keep all your pet information in one secure place - health records, vaccinations, and important documents.',
    icon: Shield,
  },
  {
    name: 'Health Tracking',
    description:
      'Monitor vaccinations, medications, and vet visits with smart reminders that keep you on schedule.',
    icon: Heart,
  },
  {
    name: 'Lost Pet Alerts',
    description:
      'Instantly notify your community if your pet goes missing. Available with Pro subscription.',
    icon: Bell,
  },
  {
    name: 'Family Sharing',
    description:
      'Share pet care responsibilities with family members seamlessly and stay coordinated.',
    icon: Users,
  },
];

const tiers = [
  {
    name: 'Free',
    price: '0',
    description: 'Perfect for single pet owners getting started',
    features: [
      '1 pet profile',
      '2 family members',
      'Basic health tracking',
      'Receive lost pet alerts',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Premium',
    price: '5.99',
    description: 'For growing families with multiple pets',
    features: [
      '2 pet profiles',
      '3 family members',
      '6 photos per pet',
      'Export capabilities',
      'Advanced reminders',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '8.99',
    description: 'Complete pet management solution',
    features: [
      'Unlimited pets',
      'Unlimited family members',
      '12 photos per pet',
      'Create lost pet alerts',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Link
                to="/auth/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign in
              </Link>
              <Link to="/auth/register" className="btn-primary">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-primary-50/30">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
            Your Pet's Health,{' '}
            <span className="text-primary-500">Simplified</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            TailTracker helps you manage your pet's health records, share care
            responsibilities with family, and keep your furry friends safe.
          </p>
          <div className="mt-10">
            <Link to="/auth/register" className="btn-primary px-8 py-3 text-base">
              Start Free Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Everything you need for pet care
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive tools to keep your pets healthy and happy, all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-5">
                  <feature.icon className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Choose the plan that works best for you and your pets
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`card p-8 flex flex-col relative !overflow-visible ${
                  tier.highlighted
                    ? 'ring-2 ring-pro shadow-lg'
                    : ''
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge-pro px-3 py-1 z-10">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold text-primary-500">
                      ${tier.price}
                    </span>
                    {tier.price !== '0' && (
                      <span className="ml-2 text-slate-500">/month</span>
                    )}
                  </div>
                  <p className="mt-2 text-slate-600 text-sm">{tier.description}</p>
                </div>
                <ul className="mt-6 space-y-3 flex-grow">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth/register"
                  className={`mt-8 w-full ${
                    tier.highlighted ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to simplify pet care?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            Join thousands of pet owners who trust TailTracker with their pet's health.
          </p>
          <Link
            to="/auth/register"
            className="mt-8 inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-sm"
          >
            Get Started for Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-surface border-t border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/terms" className="hover:text-slate-700 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-slate-700 transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} TailTracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
