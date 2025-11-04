/**
 * App Configuration
 */

export interface AppConfig {
  API_URL: string;
  API_BASE_URL: string;
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  APPLE_MERCHANT_ID: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  EXPO_PUBLIC_ENV: 'development' | 'staging' | 'production';
}

const config: AppConfig = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.tailtracker.app',
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_URL || 'https://api.tailtracker.app',
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  APPLE_MERCHANT_ID:
    process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || 'merchant.com.tailtracker.app',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  EXPO_PUBLIC_ENV:
    (process.env.EXPO_PUBLIC_ENV as 'development' | 'staging' | 'production') ||
    'development',
};

export default config;
