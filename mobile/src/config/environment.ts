import Constants from 'expo-constants';

// Environment configuration with type safety and validation
interface EnvironmentConfig {
  // Build Configuration
  NODE_ENV: 'development' | 'staging' | 'production';
  APP_ENV: 'development' | 'staging' | 'production';
  
  // Third-party Services
  GOOGLE_MAPS_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;
  REVENUECAT_API_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
  
  // Analytics
  MIXPANEL_TOKEN: string;
  SENTRY_DSN: string;
  
  // Feature flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASHLYTICS: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;
  
  // Security
  CERTIFICATE_PINNING_ENABLED: boolean;
}

// Helper function to get environment variable with validation
const getEnvVar = (key: string, required: boolean = true, defaultValue?: string): string => {
  const value = Constants.expoConfig?.extra?.[key] || 
                Constants.manifest?.extra?.[key] || 
                process.env[key] || 
                defaultValue;
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is missing`);
  }
  
  return value || '';
};

// Helper function to get boolean environment variable
const getBooleanEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvVar(key, false);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

// Get current environment
const getCurrentEnvironment = (): 'development' | 'staging' | 'production' => {
  const nodeEnv = getEnvVar('NODE_ENV', false, 'development');
  const appEnv = getEnvVar('APP_ENV', false, nodeEnv);
  
  if (['development', 'staging', 'production'].includes(appEnv)) {
    return appEnv as 'development' | 'staging' | 'production';
  }
  
  return 'development';
};

// Environment-specific configuration
const createEnvironmentConfig = (): EnvironmentConfig => {
  const currentEnv = getCurrentEnvironment();
  const isDevelopment = currentEnv === 'development';
  const isProduction = currentEnv === 'production';
  
  return {
    NODE_ENV: getEnvVar('NODE_ENV', false, 'development') as 'development' | 'staging' | 'production',
    APP_ENV: currentEnv,
    
    
    // Third-party service keys (with validation in production)
    GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY', isProduction),
    SUPABASE_URL: getEnvVar('SUPABASE_URL', isProduction),
    SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY', isProduction),
    FIREBASE_API_KEY: getEnvVar('FIREBASE_API_KEY', isProduction),
    FIREBASE_AUTH_DOMAIN: getEnvVar('FIREBASE_AUTH_DOMAIN', isProduction),
    FIREBASE_PROJECT_ID: getEnvVar('FIREBASE_PROJECT_ID', isProduction),
    FIREBASE_STORAGE_BUCKET: getEnvVar('FIREBASE_STORAGE_BUCKET', isProduction),
    FIREBASE_MESSAGING_SENDER_ID: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', isProduction),
    FIREBASE_APP_ID: getEnvVar('FIREBASE_APP_ID', isProduction),
    REVENUECAT_API_KEY: getEnvVar('REVENUECAT_API_KEY', isProduction),
    STRIPE_PUBLISHABLE_KEY: getEnvVar('STRIPE_PUBLISHABLE_KEY', isProduction),
    
    // Analytics
    MIXPANEL_TOKEN: getEnvVar('MIXPANEL_TOKEN', false),
    SENTRY_DSN: getEnvVar('SENTRY_DSN', false),
    
    // Feature flags (disabled in development by default)
    ENABLE_ANALYTICS: getBooleanEnvVar('ENABLE_ANALYTICS', !isDevelopment),
    ENABLE_CRASHLYTICS: getBooleanEnvVar('ENABLE_CRASHLYTICS', !isDevelopment),
    ENABLE_PERFORMANCE_MONITORING: getBooleanEnvVar('ENABLE_PERFORMANCE_MONITORING', isProduction),
    
    // Security settings
    CERTIFICATE_PINNING_ENABLED: getBooleanEnvVar('CERTIFICATE_PINNING_ENABLED', isProduction),
  };
};

// Export configuration
export const ENV = createEnvironmentConfig();

// Export helper functions for runtime checks
export const isDevelopment = ENV.APP_ENV === 'development';
export const isStaging = ENV.APP_ENV === 'staging';
export const isProduction = ENV.APP_ENV === 'production';

// Validation function to check if all required keys are present
export const validateEnvironment = (): { isValid: boolean; missingKeys: string[] } => {
  const requiredKeys = [
    'GOOGLE_MAPS_API_KEY',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY',
    'FIREBASE_API_KEY',
    'FIREBASE_PROJECT_ID'
  ];
  
  const missingKeys: string[] = [];
  
  // Only validate required keys in production
  if (isProduction) {
    requiredKeys.forEach(key => {
      const value = ENV[key as keyof EnvironmentConfig];
      if (!value || (typeof value === 'string' && value.includes('your_') && value.includes('_here'))) {
        missingKeys.push(key);
      }
    });
  }
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
};

// Console warnings for development
if (isDevelopment) {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('⚠️  Some environment variables are not configured:');
    validation.missingKeys.forEach(key => {
      console.warn(`   - ${key}`);
    });
    console.warn('   Set environment variables in your build system or .env file');
  }
}

export default ENV;