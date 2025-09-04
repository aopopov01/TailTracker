const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/**
 * Performance-optimized Metro configuration for TailTracker
 * Includes code splitting, tree shaking, and bundle optimization
 */

const config = getDefaultConfig(__dirname);

// Enhanced resolver configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@types': path.resolve(__dirname, 'src/types'),
};

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

// Performance-focused transformer configuration
config.transformer = {
  ...config.transformer,
  
  // Enable Hermes bytecode for better startup performance
  hermesCommand: path.resolve(__dirname, 'node_modules/hermes-engine/osx-bin/hermes'),
  
  // Minification configuration for production
  minifierConfig: {
    mangle: {
      keep_fnames: false,
    },
    output: {
      ascii_only: true,
      quote_keys: false,
      wrap_iife: true,
    },
    sourceMap: process.env.NODE_ENV !== 'production',
    toplevel: false,
    warnings: false,
    parse: {
      html5_comments: false,
    },
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: true,
      pure_funcs: process.env.NODE_ENV === 'production' 
        ? ['console.log', 'console.warn', 'console.info'] 
        : [],
      passes: 2, // Multiple compression passes
      sequences: true,
      dead_code: true,
      conditionals: true,
      booleans: true,
      unused: true,
      if_return: true,
      join_vars: true,
    },
  },
  
  // Enable async imports for code splitting
  asyncRequireModulePath: require.resolve('metro-runtime/src/modules/asyncRequire'),
  
  // Optimize image assets
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Enhanced serializer for code splitting and tree shaking
config.serializer = {
  ...config.serializer,
  
  // Process module filter for tree shaking
  processModuleFilter: (module) => {
    // Exclude test files from production bundle
    if (process.env.NODE_ENV === 'production') {
      if (module.path.includes('__tests__') || 
          module.path.includes('__mocks__') ||
          module.path.includes('.test.') ||
          module.path.includes('.spec.') ||
          module.path.includes('test/')) {
        return false;
      }
    }
    
    // Exclude dev-only modules
    if (module.path.includes('dev-only') || 
        module.path.includes('development-only')) {
      return false;
    }
    
    // Include all other modules
    return true;
  },
  
  // Custom serializer for better code splitting
  customSerializer: (entryPoint, preModules, graph, options) => {
    // Group modules by feature for better caching
    const featureGroups = {
      auth: [],
      lostPet: [],
      payment: [],
      ui: [],
      core: [],
    };
    
    graph.dependencies.forEach(([path, module]) => {
      if (path.includes('auth') || path.includes('Auth')) {
        featureGroups.auth.push(module);
      } else if (path.includes('LostPet') || path.includes('lost-pet')) {
        featureGroups.lostPet.push(module);
      } else if (path.includes('Payment') || path.includes('payment')) {
        featureGroups.payment.push(module);
      } else if (path.includes('components/UI') || path.includes('ui/')) {
        featureGroups.ui.push(module);
      } else {
        featureGroups.core.push(module);
      }
    });
    
    // Return default serialization with grouping hints
    const defaultSerializer = require('metro/src/DeltaBundler/Serializers/baseJSBundle');
    return defaultSerializer(entryPoint, preModules, graph, options);
  },
  
  // Optimize module order for better compression
  createModuleIdFactory: () => {
    let nextId = 0;
    const moduleIds = new Map();
    
    return (path) => {
      if (!moduleIds.has(path)) {
        // Assign smaller IDs to frequently used modules
        let id = nextId++;
        
        // Core React Native modules get lower IDs (better compression)
        if (path.includes('react-native/') || path.includes('react/')) {
          id = nextId - 1000;
        }
        
        moduleIds.set(path, id);
      }
      
      return moduleIds.get(path);
    };
  },
};

// Performance monitoring and caching
config.cacheStores = [
  {
    name: 'FileStore',
    path: path.resolve(__dirname, 'node_modules/.cache/metro'),
  },
];

// Watch folder configuration for development
config.watchFolders = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'assets'),
];

// Server configuration for development performance
config.server = {
  ...config.server,
  
  // Enable compression for better development performance
  enableVisualizer: false, // Disable in production
  
  // Port configuration
  port: process.env.METRO_PORT || 8081,
  
  // Enhanced development middleware
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Add performance headers
      res.setHeader('X-Metro-Performance-Start', Date.now());
      
      middleware(req, res, (err) => {
        if (!err) {
          const duration = Date.now() - parseInt(res.getHeader('X-Metro-Performance-Start'));
          res.setHeader('X-Metro-Performance-Duration', duration);
          
          // Log slow requests in development
          if (process.env.NODE_ENV !== 'production' && duration > 1000) {
            console.warn(`Slow Metro request: ${req.url} took ${duration}ms`);
          }
        }
        next(err);
      });
    };
  },
};

// Production-specific optimizations
if (process.env.NODE_ENV === 'production') {
  // Disable source maps in production for smaller bundles
  config.transformer.minifierConfig.sourceMap = false;
  
  // Enable more aggressive optimizations
  config.transformer.minifierConfig.compress = {
    ...config.transformer.minifierConfig.compress,
    drop_console: true,
    drop_debugger: true,
    pure_funcs: ['console.log', 'console.warn', 'console.info', 'console.debug'],
    passes: 3, // More compression passes
    unsafe: true, // Enable unsafe optimizations
    unsafe_comps: true,
    unsafe_math: true,
    unsafe_proto: true,
  };
  
  // Tree shaking configuration
  config.resolver.unstable_enablePackageExports = true;
  config.resolver.unstable_conditionNames = ['react-native', 'require', 'import'];
}

// Development-specific optimizations
if (process.env.NODE_ENV === 'development') {
  // Enable fast refresh
  config.transformer.unstable_allowRequireContext = true;
  
  // Better error reporting
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  
  // Source map configuration for debugging
  config.transformer.minifierConfig.sourceMap = true;
  config.transformer.minifierConfig.compress.drop_console = false;
}

// Bundle analyzer configuration for performance monitoring
if (process.env.ANALYZE_BUNDLE === 'true') {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  
  config.serializer.customSerializer = (entryPoint, preModules, graph, options) => {
    const bundleInfo = {
      totalModules: graph.dependencies.size,
      modulesByFeature: {},
      bundleSize: 0,
    };
    
    // Analyze bundle composition
    graph.dependencies.forEach(([path, module]) => {
      const feature = path.includes('node_modules') ? 'dependencies' : 'application';
      bundleInfo.modulesByFeature[feature] = (bundleInfo.modulesByFeature[feature] || 0) + 1;
      bundleInfo.bundleSize += module.output ? module.output.length : 0;
    });
    
    console.log('Bundle Analysis:', bundleInfo);
    
    // Return default serialization
    const defaultSerializer = require('metro/src/DeltaBundler/Serializers/baseJSBundle');
    return defaultSerializer(entryPoint, preModules, graph, options);
  };
}

module.exports = config;