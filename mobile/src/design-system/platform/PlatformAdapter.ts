/**
 * TailTracker Cross-Platform Consistency Framework
 * 
 * A comprehensive platform adapter system that ensures visual and functional
 * consistency across iOS and Android while respecting platform-specific guidelines.
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';
import { tailTrackerColors } from '../core/colors';
import { tailTrackerTypography } from '../core/typography';

// ====================================
// PLATFORM DETECTION & CAPABILITIES
// ====================================

export interface PlatformCapabilities {
  hasNotchSupport: boolean;
  hasSafeAreaInsets: boolean;
  supportsHapticFeedback: boolean;
  supportsBlur: boolean;
  supportsFaceID: boolean;
  supportsBiometrics: boolean;
  maxImageResolution: number;
  preferredAnimationDuration: number;
  gestureThreshold: number;
}

export interface PlatformMetrics {
  screenWidth: number;
  screenHeight: number;
  pixelDensity: number;
  fontScale: number;
  isTablet: boolean;
  isLandscape: boolean;
  statusBarHeight: number;
  navigationBarHeight: number;
  tabBarHeight: number;
}

export class PlatformAdapter {
  private static instance: PlatformAdapter;
  private metrics: PlatformMetrics;
  private capabilities: PlatformCapabilities;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.capabilities = this.initializeCapabilities();
  }

  static getInstance(): PlatformAdapter {
    if (!PlatformAdapter.instance) {
      PlatformAdapter.instance = new PlatformAdapter();
    }
    return PlatformAdapter.instance;
  }

  // ====================================
  // METRICS INITIALIZATION
  // ====================================

  private initializeMetrics(): PlatformMetrics {
    const { width, height } = Dimensions.get('window');
    const pixelDensity = PixelRatio.get();
    const fontScale = PixelRatio.getFontScale();
    
    // Tablet detection based on screen size and pixel density
    const isTablet = this.detectTablet(width, height, pixelDensity);
    
    return {
      screenWidth: width,
      screenHeight: height,
      pixelDensity,
      fontScale,
      isTablet,
      isLandscape: width > height,
      statusBarHeight: this.getStatusBarHeight(),
      navigationBarHeight: this.getNavigationBarHeight(),
      tabBarHeight: this.getTabBarHeight(isTablet),
    };
  }

  private detectTablet(width: number, height: number, pixelDensity: number): boolean {
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);
    
    if (Platform.OS === 'ios') {
      // iPad detection: larger screen dimensions
      return minDimension >= 768 || maxDimension >= 1024;
    } else {
      // Android tablet detection: screen size and density
      const densityFactor = pixelDensity <= 2 ? 1.5 : 1;
      return (minDimension * densityFactor) >= 600;
    }
  }

  private getStatusBarHeight(): number {
    if (Platform.OS === 'ios') {
      // iOS status bar heights vary by device
      if (this.metrics?.screenHeight >= 812) return 44; // iPhone X and newer
      return 20; // Older iPhones
    }
    return 24; // Android standard
  }

  private getNavigationBarHeight(): number {
    if (Platform.OS === 'ios') {
      return 44; // iOS navigation bar
    }
    return 56; // Android action bar
  }

  private getTabBarHeight(isTablet: boolean): number {
    if (Platform.OS === 'ios') {
      if (isTablet) return 50;
      return this.metrics?.screenHeight >= 812 ? 83 : 49; // Safe area for newer iPhones
    }
    return 56; // Android bottom navigation
  }

  private initializeCapabilities(): PlatformCapabilities {
    return {
      hasNotchSupport: Platform.OS === 'ios' && this.metrics.screenHeight >= 812,
      hasSafeAreaInsets: Platform.OS === 'ios' || Platform.Version >= 28,
      supportsHapticFeedback: Platform.OS === 'ios' || Platform.Version >= 26,
      supportsBlur: Platform.OS === 'ios' || Platform.Version >= 31,
      supportsFaceID: Platform.OS === 'ios',
      supportsBiometrics: true,
      maxImageResolution: Platform.OS === 'ios' ? 4096 : 2048,
      preferredAnimationDuration: Platform.OS === 'ios' ? 300 : 250,
      gestureThreshold: Platform.OS === 'ios' ? 10 : 16,
    };
  }

  // ====================================
  // PUBLIC API
  // ====================================

  getMetrics(): PlatformMetrics {
    return { ...this.metrics };
  }

  getCapabilities(): PlatformCapabilities {
    return { ...this.capabilities };
  }

  isIOS(): boolean {
    return Platform.OS === 'ios';
  }

  isAndroid(): boolean {
    return Platform.OS === 'android';
  }

  isTablet(): boolean {
    return this.metrics.isTablet;
  }

  // Update metrics when orientation changes
  updateMetrics(): void {
    const { width, height } = Dimensions.get('window');
    this.metrics.screenWidth = width;
    this.metrics.screenHeight = height;
    this.metrics.isLandscape = width > height;
  }
}

// ====================================
// PLATFORM-SPECIFIC DESIGN TOKENS
// ====================================

export interface PlatformDesignTokens {
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    pill: number;
  };
  shadows: {
    small: any;
    medium: any;
    large: any;
  };
  spacing: {
    touch: number;
    minimum: number;
    comfortable: number;
  };
  animations: {
    quick: number;
    normal: number;
    slow: number;
    springConfig: any;
  };
}

class PlatformDesignSystem {
  private static iosTokens: PlatformDesignTokens = {
    borderRadius: {
      small: 8,
      medium: 12,
      large: 16,
      pill: 25,
    },
    shadows: {
      small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
      },
      large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    },
    spacing: {
      touch: 44,
      minimum: 16,
      comfortable: 24,
    },
    animations: {
      quick: 200,
      normal: 300,
      slow: 500,
      springConfig: {
        damping: 15,
        mass: 1,
        stiffness: 150,
      },
    },
  };

  private static androidTokens: PlatformDesignTokens = {
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
      pill: 20,
    },
    shadows: {
      small: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
      medium: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
      },
      large: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    },
    spacing: {
      touch: 48,
      minimum: 16,
      comfortable: 24,
    },
    animations: {
      quick: 150,
      normal: 250,
      slow: 375,
      springConfig: {
        damping: 20,
        mass: 1,
        stiffness: 200,
      },
    },
  };

  static getTokens(): PlatformDesignTokens {
    return Platform.OS === 'ios' ? this.iosTokens : this.androidTokens;
  }

  static getBorderRadius(size: keyof PlatformDesignTokens['borderRadius']): number {
    return this.getTokens().borderRadius[size];
  }

  static getShadow(size: keyof PlatformDesignTokens['shadows']): any {
    return this.getTokens().shadows[size];
  }

  static getSpacing(type: keyof PlatformDesignTokens['spacing']): number {
    return this.getTokens().spacing[type];
  }

  static getAnimationDuration(speed: keyof PlatformDesignTokens['animations']): number {
    const tokens = this.getTokens();
    return tokens.animations[speed] as number;
  }

  static getSpringConfig(): any {
    return this.getTokens().animations.springConfig;
  }
}

// ====================================
// CONSISTENT STYLING SYSTEM
// ====================================

export interface ConsistentStyle {
  container: any;
  card: any;
  button: any;
  input: any;
  modal: any;
  list: any;
}

export class ConsistentStyling {
  private static adapter = PlatformAdapter.getInstance();
  private static designTokens = PlatformDesignSystem.getTokens();

  static getConsistentStyles(): ConsistentStyle {
    const metrics = this.adapter.getMetrics();
    const isTablet = metrics.isTablet;
    
    return {
      container: {
        flex: 1,
        backgroundColor: tailTrackerColors.light.background,
        paddingHorizontal: this.designTokens.spacing.minimum,
        paddingTop: metrics.statusBarHeight,
      },
      
      card: {
        backgroundColor: tailTrackerColors.light.surfacePrimary,
        borderRadius: this.designTokens.borderRadius.medium,
        padding: this.designTokens.spacing.comfortable,
        marginVertical: 8,
        ...this.designTokens.shadows.small,
      },
      
      button: {
        height: this.designTokens.spacing.touch,
        paddingHorizontal: this.designTokens.spacing.comfortable,
        borderRadius: this.designTokens.borderRadius.small,
        justifyContent: 'center',
        alignItems: 'center',
        ...this.designTokens.shadows.small,
      },
      
      input: {
        height: this.designTokens.spacing.touch,
        paddingHorizontal: this.designTokens.spacing.minimum,
        borderRadius: this.designTokens.borderRadius.small,
        borderWidth: Platform.select({ ios: 1, android: 0 }),
        borderColor: tailTrackerColors.light.borderPrimary,
        backgroundColor: tailTrackerColors.light.surfacePrimary,
        fontSize: tailTrackerTypography.body.body.fontSize,
      },
      
      modal: {
        backgroundColor: tailTrackerColors.light.background,
        borderTopLeftRadius: this.designTokens.borderRadius.large,
        borderTopRightRadius: this.designTokens.borderRadius.large,
        paddingTop: 12,
        paddingHorizontal: this.designTokens.spacing.minimum,
        minHeight: metrics.screenHeight * 0.3,
        ...this.designTokens.shadows.large,
      },
      
      list: {
        backgroundColor: 'transparent',
        paddingVertical: 8,
        showsVerticalScrollIndicator: Platform.OS === 'ios',
      },
    };
  }

  // Platform-specific style variations
  static applyPlatformVariant<T>(styles: T, iosVariant?: Partial<T>, androidVariant?: Partial<T>): T {
    const baseStyles = { ...styles } as any;
    
    if (Platform.OS === 'ios' && iosVariant) {
      Object.assign(baseStyles, iosVariant);
    } else if (Platform.OS === 'android' && androidVariant) {
      Object.assign(baseStyles, androidVariant);
    }
    
    return baseStyles;
  }
}

// ====================================
// EXPORTS
// ====================================

export const platformAdapter = PlatformAdapter.getInstance();
export const platformDesign = PlatformDesignSystem;
export const consistentStyling = ConsistentStyling;

export default {
  adapter: platformAdapter,
  design: platformDesign,
  styling: consistentStyling,
};