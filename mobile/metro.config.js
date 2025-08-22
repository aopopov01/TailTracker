const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configure Metro for optimal device testing
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable fast refresh and improve performance
config.server = {
  ...config.server,
  // Enhanced network configuration for device testing
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Enable CORS for device testing
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.end();
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

// Optimize asset serving for mobile devices
config.transformer = {
  ...config.transformer,
  // Enable asset optimization
  enableBabelRCLookup: false,
  enableBabelRuntime: false,
};

// Configure asset extensions for device testing
config.resolver.assetExts.push(
  // Audio formats
  'wav', 'mp3', 'mp4', 'aac', 'm4a',
  // Video formats  
  'mov', 'avi', 'webm',
  // Document formats
  'pdf', 'doc', 'docx',
  // Additional image formats
  'webp', 'heic', 'heif'
);

// Configure source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx', 'js', 'ts', 'tsx', 'json', 'mjs'
];

// Performance optimizations for device testing
config.watchFolders = [
  // Only watch necessary folders to improve performance
  `${__dirname}/src`,
  `${__dirname}/assets`,
  `${__dirname}/app`,
];

// Configure caching for better development performance
config.cacheStores = [
  {
    name: 'filesystem',
    enabled: true,
  },
];

module.exports = config;