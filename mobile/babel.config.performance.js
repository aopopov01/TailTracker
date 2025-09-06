module.exports = function(api) {
  api.cache(true);
  
  // Determine if we're in production
  const isProduction = api.env('production');
  const isDevelopment = api.env('development');
  
  return {
    presets: [
      ['babel-preset-expo', { 
        // Optimize JSX for production
        jsxRuntime: 'automatic',
        jsxImportSource: 'react',
        // Enable modern transforms
        useTransformReactJSXExperimental: true
      }]
    ],
    plugins: [
      // Performance-critical plugins first
      ['@babel/plugin-transform-react-jsx', {
        runtime: 'automatic',
        development: isDevelopment,
        // Optimize JSX transforms
        throwIfNamespace: false,
        pure: true
      }],
      
      // Module resolution optimization
      ['module-resolver', {
        root: ['./'],
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@types': './src/types',
          '@contexts': './src/contexts',
          '@navigation': './src/navigation',
          '@theme': './src/theme',
          '@config': './src/config',
          '@assets': './assets'
        }
      }],

      // React Native Reanimated (performance critical)
      'react-native-reanimated/plugin',

      // Production optimizations
      ...(isProduction ? [
        // Remove console statements in production
        ['transform-remove-console', { 
          exclude: ['error', 'warn'] 
        }],
        
        // Inline environment variables
        ['transform-inline-environment-variables'],
        
        // Remove dead code
        ['babel-plugin-transform-remove-undefined'],
        
        // Optimize imports
        ['babel-plugin-transform-imports', {
          'react-native-vector-icons': {
            transform: 'react-native-vector-icons/dist/${member}',
            preventFullImport: true
          },
          '@expo/vector-icons': {
            transform: '@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/${member}.ttf',
            preventFullImport: true
          }
        }]
      ] : []),

      // Development optimizations
      ...(isDevelopment ? [
        // Fast refresh for development
        'react-refresh/babel'
      ] : [])
    ],

    // Environment-specific configurations
    env: {
      production: {
        plugins: [
          // Additional production-only optimizations
          ['babel-plugin-transform-react-remove-prop-types', {
            removeImport: true,
            additionalLibraries: ['react-immutable-proptypes']
          }]
        ]
      }
    },

    // Compilation optimizations
    compact: isProduction,
    minified: isProduction,
    comments: !isProduction,
    
    // Source map configuration
    sourceMaps: isDevelopment ? 'inline' : false,
    
    // Optimize for bundle size
    assumptions: {
      noDocumentAll: true,
      noClassCalls: true,
      constantReexports: true,
      constantSuper: true,
      enumerableModuleMeta: true,
      ignoreFunctionLength: true,
      ignoreToPrimitiveHint: true,
      iterableIsArray: true,
      mutableTemplateObject: true,
      noIncompleteNsImportDetection: true,
      noNewArrows: true,
      objectRestNoSymbols: true,
      privateFieldsAsProperties: true,
      pureGetters: true,
      setClassMethods: true,
      setComputedProperties: true,
      setPublicClassFields: true,
      setSpreadProperties: true,
      skipForOfIteratorClosing: true,
      superIsCallableConstructor: true
    }
  };
};