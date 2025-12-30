const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize for clean single-port development
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Asset extensions for complete media support
config.resolver.assetExts.push(
  'wav', 'mp3', 'mp4', 'aac', 'm4a', 'mov', 'avi', 'webm',
  'pdf', 'doc', 'docx', 'webp', 'heic', 'heif'
);

// Source extensions 
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'jsx', 'js', 'ts', 'tsx', 'json', 'mjs'
];

module.exports = config;