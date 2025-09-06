const { mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const performanceConfig = {
  // Enhanced resolver configuration for optimal performance
  resolver: {
    platforms: ['ios', 'android', 'native'],
    
    // Optimized asset extensions with priority order
    assetExts: [
      // Images - prioritize modern formats
      'webp', 'avif', 'png', 'jpg', 'jpeg', 'gif', 'svg',
      // Audio - optimized formats first
      'aac', 'm4a', 'mp3', 'wav',
      // Video - modern formats
      'mp4', 'webm', 'mov', 'avi',
      // Documents
      'pdf', 'doc', 'docx',
      // Other
      'heic', 'heif'
    ],
    
    // Source extensions with performance priority
    sourceExts: [
      'tsx', 'ts', 'jsx', 'js', 'json', 'mjs', 'cjs'
    ],

    // Optimize node modules resolution
    nodeModulesPaths: [
      './node_modules',
      '../node_modules'
    ],

    // Enable faster resolution with blocklist
    blockList: [
      /.*\.d\.ts$/,
      /.*\.stories\.(ts|tsx|js|jsx)$/,
      /.*\.test\.(ts|tsx|js|jsx)$/,
      /.*\.spec\.(ts|tsx|js|jsx)$/,
      /.*__tests__\/.*/,
      /.*__mocks__.*/,
      /.*\.config\.(ts|js)$/,
      /coverage\/.*/,
      /docs\/.*/,
      /screenshots\/.*/,
      /\.vscode\/.*/,
      /\.git\/.*/
    ]
  },

  // Transformer optimizations
  transformer: {
    // Enable Babel optimizations
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
    
    // Asset transformer optimizations
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
    
    // Enable minification in all environments
    minifierConfig: {
      keep_fnames: false,
      mangle: {
        keep_fnames: false,
        reserved: ['__DEV__']
      },
      output: {
        ascii_only: true,
        quote_style: 3,
        wrap_iife: true
      },
      sourceMap: false,
      toplevel: false,
      warnings: false,
      ie8: false
    },

    // SVG transformer for optimal icon handling
    unstable_allowRequireContext: true,
    
    // Optimize transforms
    experimentalImportSupport: true,
    inlineRequires: true
  },

  // Serializer optimizations for bundle size
  serializer: {
    // Optimize output modules
    createModuleIdFactory: () => (path) => {
      // Generate shorter module IDs for smaller bundles
      return path.replace(__dirname, '').replace(/^\//, '').replace(/\//g, '_').replace(/\./g, '_');
    },

    // Minimize output
    options: {
      output: {
        comments: false,
        ascii_only: true
      }
    }
  },

  // Server configuration for development performance
  server: {
    port: 8081,
    enableVisualizer: false
  },

  // Cache configuration for faster builds
  cacheStores: [
    {
      name: 'file-system',
      path: './node_modules/.cache/metro'
    }
  ],

  // Watch configuration
  watchFolders: [
    './src',
    './app',
    './assets',
    './contexts'
  ],

  // Optimize for production builds
  resetCache: false,
  maxWorkers: require('os').cpus().length
};

module.exports = mergeConfig(defaultConfig, performanceConfig);