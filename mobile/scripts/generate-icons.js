#!/usr/bin/env node

/**
 * TailTracker Icon Generation Script
 * 
 * Generates all required app icons and splash screens from the SVG logo
 * for both iOS and Android platforms following platform-specific guidelines.
 * 
 * Requirements:
 * - Node.js
 * - sharp (npm install sharp)
 * - svglib2 (npm install svglib2) or similar SVG processing library
 * 
 * Usage: node generate-icons.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const SVG_SOURCE = path.join(ROOT_DIR, 'assets/logo/tailtracker-logo.svg');
const IOS_ICONS_DIR = path.join(ROOT_DIR, 'assets/icons/ios');
const ANDROID_RES_DIR = path.join(ROOT_DIR, 'android/app/src/main/res');
const SPLASH_DIR = path.join(ROOT_DIR, 'assets/splash');

// Icon specifications
const IOS_ICONS = [
  { name: 'Icon-1024.png', size: 1024, description: 'App Store icon' },
  { name: 'Icon-180.png', size: 180, description: 'iPhone app icon @3x' },
  { name: 'Icon-120.png', size: 120, description: 'iPhone app icon @2x' },
  { name: 'Icon-167.png', size: 167, description: 'iPad Pro app icon' },
  { name: 'Icon-152.png', size: 152, description: 'iPad app icon @2x' },
  { name: 'Icon-76.png', size: 76, description: 'iPad app icon' }
];

const ANDROID_ICONS = [
  { name: 'ic_launcher.png', size: 192, density: 'xxxhdpi', description: 'Android launcher icon xxxhdpi' },
  { name: 'ic_launcher.png', size: 144, density: 'xxhdpi', description: 'Android launcher icon xxhdpi' },
  { name: 'ic_launcher.png', size: 96, density: 'xhdpi', description: 'Android launcher icon xhdpi' },
  { name: 'ic_launcher.png', size: 72, density: 'hdpi', description: 'Android launcher icon hdpi' },
  { name: 'ic_launcher.png', size: 48, density: 'mdpi', description: 'Android launcher icon mdpi' }
];

const SPLASH_SCREENS = [
  { name: 'splash.png', size: 2048, background: '#FFFFFF', description: 'Main splash screen' },
  { name: 'splash-dark.png', size: 2048, background: '#1A1A1A', description: 'Dark mode splash screen' }
];

// Utility functions
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

function checkDependencies() {
  try {
    execSync('which convert', { stdio: 'ignore' });
    console.log('✓ ImageMagick found');
  } catch (_error) {
    console.error('❌ ImageMagick not found. Please install ImageMagick:');
    console.error('Ubuntu/Debian: sudo apt-get install imagemagick');
    console.error('macOS: brew install imagemagick');
    console.error('Windows: Download from https://imagemagick.org/script/download.php#windows');
    process.exit(1);
  }

  if (!fs.existsSync(SVG_SOURCE)) {
    console.error(`❌ SVG source not found: ${SVG_SOURCE}`);
    process.exit(1);
  }
}

function generateIcon(outputPath, size, backgroundColor = null, cornerRadius = null) {
  try {
    let command = `convert "${SVG_SOURCE}"`;
    
    if (backgroundColor) {
      command += ` -background "${backgroundColor}" -flatten`;
    } else {
      command += ` -background transparent`;
    }
    
    command += ` -resize ${size}x${size}`;
    
    if (cornerRadius) {
      // Create rounded corners for iOS icons
      command += ` \\( +clone -threshold -1 -negate -fill white -draw "roundrectangle 0,0 ${size},${size} ${cornerRadius},${cornerRadius}" \\) -alpha off -compose copy_opacity -composite`;
    }
    
    command += ` "${outputPath}"`;
    
    execSync(command, { stdio: 'ignore' });
    console.log(`Generated: ${path.basename(outputPath)} (${size}x${size})`);
  } catch (error) {
    console.error(`Failed to generate ${outputPath}:`, error.message);
  }
}

function generateSplashScreen(outputPath, size, backgroundColor) {
  try {
    // Create splash screen with logo centered on background
    const logoSize = Math.floor(size * 0.3); // Logo takes 30% of screen
    const command = `convert -size ${size}x${size} xc:"${backgroundColor}" \\( "${SVG_SOURCE}" -resize ${logoSize}x${logoSize} \\) -gravity center -composite "${outputPath}"`;
    
    execSync(command, { stdio: 'ignore' });
    console.log(`Generated splash: ${path.basename(outputPath)} (${size}x${size}) with ${backgroundColor} background`);
  } catch (error) {
    console.error(`Failed to generate splash ${outputPath}:`, error.message);
  }
}

function generateIOSIcons() {
  console.log('\n📱 Generating iOS Icons...');
  ensureDirectoryExists(IOS_ICONS_DIR);
  
  IOS_ICONS.forEach(icon => {
    const outputPath = path.join(IOS_ICONS_DIR, icon.name);
    // iOS icons have subtle rounded corners, especially for larger sizes
    const cornerRadius = icon.size >= 180 ? Math.floor(icon.size * 0.2237) : Math.floor(icon.size * 0.1743);
    generateIcon(outputPath, icon.size, '#FFFFFF', cornerRadius);
  });
}

function generateAndroidIcons() {
  console.log('\n🤖 Generating Android Icons...');
  
  // Generate standard launcher icons
  ANDROID_ICONS.forEach(icon => {
    const densityDir = path.join(ANDROID_RES_DIR, `mipmap-${icon.density}`);
    ensureDirectoryExists(densityDir);
    
    const outputPath = path.join(densityDir, icon.name);
    generateIcon(outputPath, icon.size, null); // Transparent background for adaptive icons
    
    // Also generate round version
    const roundOutputPath = path.join(densityDir, 'ic_launcher_round.png');
    generateIcon(roundOutputPath, icon.size, null);
  });
  
  console.log('Android icons support adaptive icons - ensure you have proper foreground/background layers in your app configuration.');
}

function generateSplashScreens() {
  console.log('\n🎨 Generating Splash Screens...');
  ensureDirectoryExists(SPLASH_DIR);
  
  SPLASH_SCREENS.forEach(splash => {
    const outputPath = path.join(SPLASH_DIR, splash.name);
    generateSplashScreen(outputPath, splash.size, splash.background);
  });
}

function generateIconSetJSON() {
  const iconSetData = {
    "images": [
      {
        "idiom": "iphone",
        "scale": "2x",
        "size": "20x20",
        "filename": "Icon-40.png"
      },
      {
        "idiom": "iphone",
        "scale": "3x",
        "size": "20x20",
        "filename": "Icon-60.png"
      },
      {
        "idiom": "iphone",
        "scale": "2x",
        "size": "29x29",
        "filename": "Icon-58.png"
      },
      {
        "idiom": "iphone",
        "scale": "3x",
        "size": "29x29",
        "filename": "Icon-87.png"
      },
      {
        "idiom": "iphone",
        "scale": "2x",
        "size": "40x40",
        "filename": "Icon-80.png"
      },
      {
        "idiom": "iphone",
        "scale": "3x",
        "size": "40x40",
        "filename": "Icon-120.png"
      },
      {
        "idiom": "iphone",
        "scale": "2x",
        "size": "60x60",
        "filename": "Icon-120.png"
      },
      {
        "idiom": "iphone",
        "scale": "3x",
        "size": "60x60",
        "filename": "Icon-180.png"
      },
      {
        "idiom": "ipad",
        "scale": "1x",
        "size": "76x76",
        "filename": "Icon-76.png"
      },
      {
        "idiom": "ipad",
        "scale": "2x",
        "size": "76x76",
        "filename": "Icon-152.png"
      },
      {
        "idiom": "ipad",
        "scale": "2x",
        "size": "83.5x83.5",
        "filename": "Icon-167.png"
      },
      {
        "idiom": "ios-marketing",
        "scale": "1x",
        "size": "1024x1024",
        "filename": "Icon-1024.png"
      }
    ],
    "info": {
      "author": "TailTracker Icon Generator",
      "version": 1
    }
  };
  
  const contentsPath = path.join(IOS_ICONS_DIR, 'Contents.json');
  fs.writeFileSync(contentsPath, JSON.stringify(iconSetData, null, 2));
  console.log('Generated Contents.json for iOS icon set');
}

function printSummary() {
  console.log('\n✅ Icon Generation Complete!');
  console.log('\nGenerated Files:');
  console.log('📱 iOS Icons:');
  IOS_ICONS.forEach(icon => {
    console.log(`   - ${icon.name} (${icon.size}x${icon.size}) - ${icon.description}`);
  });
  
  console.log('\n🤖 Android Icons:');
  ANDROID_ICONS.forEach(icon => {
    console.log(`   - mipmap-${icon.density}/${icon.name} (${icon.size}x${icon.size}) - ${icon.description}`);
    console.log(`   - mipmap-${icon.density}/ic_launcher_round.png (${icon.size}x${icon.size}) - Round version`);
  });
  
  console.log('\n🎨 Splash Screens:');
  SPLASH_SCREENS.forEach(splash => {
    console.log(`   - ${splash.name} (${splash.size}x${splash.size}) - ${splash.description}`);
  });
  
  console.log('\n📝 Next Steps:');
  console.log('1. For React Native: Update app.json/app.config.js with new icon paths');
  console.log('2. For iOS: Add icon files to your Xcode project');
  console.log('3. For Android: Ensure adaptive icon configuration in android/app/src/main/res/mipmap-anydpi-v26/');
  console.log('4. Test icons on different devices and screen densities');
}

// Main execution
function main() {
  console.log('🚀 TailTracker Icon Generator Starting...');
  
  checkDependencies();
  generateIOSIcons();
  generateAndroidIcons();
  generateSplashScreens();
  generateIconSetJSON();
  printSummary();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateIOSIcons,
  generateAndroidIcons,
  generateSplashScreens,
  generateIconSetJSON
};