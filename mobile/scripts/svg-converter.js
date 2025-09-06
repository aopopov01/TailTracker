#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple SVG to PNG conversion using Node.js Canvas (if available) or browser simulation
// const svgContent = fs.readFileSync(path.join(__dirname, '../assets/logo/tailtracker-logo.svg'), 'utf8');

// Icon specifications
const iosIcons = [
    { name: 'Icon-1024.png', size: 1024 },
    { name: 'Icon-180.png', size: 180 },
    { name: 'Icon-120.png', size: 120 },
    { name: 'Icon-167.png', size: 167 },
    { name: 'Icon-152.png', size: 152 },
    { name: 'Icon-76.png', size: 76 }
];

const androidIcons = [
    { name: 'ic_launcher.png', size: 192, density: 'xxxhdpi' },
    { name: 'ic_launcher.png', size: 144, density: 'xxhdpi' },
    { name: 'ic_launcher.png', size: 96, density: 'xhdpi' },
    { name: 'ic_launcher.png', size: 72, density: 'hdpi' },
    { name: 'ic_launcher.png', size: 48, density: 'mdpi' }
];

const splashScreens = [
    { name: 'splash.png', size: 2048, background: '#FFFFFF' },
    { name: 'splash-dark.png', size: 2048, background: '#1A1A1A' }
];

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

function createDirectoryStructure() {
    const rootDir = path.join(__dirname, '..');
    
    // iOS icons directory
    ensureDir(path.join(rootDir, 'assets/icons/ios'));
    
    // Android icons directories
    androidIcons.forEach(icon => {
        ensureDir(path.join(rootDir, `android/app/src/main/res/mipmap-${icon.density}`));
    });
    
    // Splash screens directory
    ensureDir(path.join(rootDir, 'assets/splash'));
}

function createIOSContentsJson() {
    const contentsJson = {
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

    const contentsPath = path.join(__dirname, '../assets/icons/ios/Contents.json');
    fs.writeFileSync(contentsPath, JSON.stringify(contentsJson, null, 2));
    console.log('✓ Created iOS Contents.json');
}

function createAndroidConfig() {
    const rootDir = path.join(__dirname, '..');
    
    // Create adaptive icon directories
    ensureDir(path.join(rootDir, 'android/app/src/main/res/mipmap-anydpi-v26'));
    ensureDir(path.join(rootDir, 'android/app/src/main/res/values'));
    
    // Adaptive icon XML
    const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher"/>
</adaptive-icon>`;

    const adaptiveIconRoundXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_round"/>
</adaptive-icon>`;

    const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>`;

    fs.writeFileSync(path.join(rootDir, 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'), adaptiveIconXml);
    fs.writeFileSync(path.join(rootDir, 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml'), adaptiveIconRoundXml);
    fs.writeFileSync(path.join(rootDir, 'android/app/src/main/res/values/colors.xml'), colorsXml);
    
    console.log('✓ Created Android adaptive icon configuration');
}

function main() {
    console.log('🚀 TailTracker Icon Generator Starting...');
    console.log('⚠️  Note: This script creates the directory structure and configuration files.');
    console.log('    For actual PNG generation, please use the web-based converter or install ImageMagick/rsvg-convert.');
    
    createDirectoryStructure();
    createIOSContentsJson();
    createAndroidConfig();
    
    console.log('\n📝 Next Steps:');
    console.log('1. Open the HTML converter: file://' + path.resolve(__dirname, 'svg-to-png-converter.html'));
    console.log('2. Generate and download all icons from the web interface');
    console.log('3. Place the downloaded icons in their respective directories:');
    console.log('   - iOS icons → assets/icons/ios/');
    console.log('   - Android icons → android/app/src/main/res/mipmap-{density}/');
    console.log('   - Splash screens → assets/splash/');
    
    console.log('\n📱 Required iOS Icons:');
    iosIcons.forEach(icon => {
        console.log(`   - ${icon.name} (${icon.size}x${icon.size})`);
    });
    
    console.log('\n🤖 Required Android Icons:');
    androidIcons.forEach(icon => {
        console.log(`   - mipmap-${icon.density}/ic_launcher.png (${icon.size}x${icon.size})`);
        console.log(`   - mipmap-${icon.density}/ic_launcher_round.png (${icon.size}x${icon.size})`);
    });
    
    console.log('\n🎨 Required Splash Screens:');
    splashScreens.forEach(splash => {
        console.log(`   - ${splash.name} (${splash.size}x${splash.size}) - Background: ${splash.background}`);
    });
    
    console.log('\n✅ Directory structure and configuration files created successfully!');
}

if (require.main === module) {
    main();
}