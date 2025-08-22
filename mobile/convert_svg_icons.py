#!/usr/bin/env python3
"""
SVG to PNG Icon Converter for TailTracker
Converts SVG icons to proper PNG format for Android and iOS compliance
"""

import os
import subprocess
import sys

def check_dependencies():
    """Check if required tools are available"""
    try:
        subprocess.run(['convert', '-version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("ImageMagick 'convert' not found. Installing...")
        try:
            subprocess.run(['sudo', 'apt-get', 'update'], check=True)
            subprocess.run(['sudo', 'apt-get', 'install', '-y', 'imagemagick'], check=True)
            return True
        except subprocess.CalledProcessError:
            print("Could not install ImageMagick. Please install manually:")
            print("sudo apt-get install imagemagick")
            return False

def convert_svg_to_png(svg_path, png_path, size):
    """Convert SVG to PNG with specific size"""
    try:
        cmd = [
            'convert',
            '-background', 'transparent',
            '-resize', f'{size}x{size}',
            svg_path,
            png_path
        ]
        subprocess.run(cmd, check=True)
        print(f"✓ Created {png_path} ({size}x{size})")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to create {png_path}: {e}")
        return False

def create_android_icons():
    """Convert SVG icons for Android"""
    base_svg = 'assets/tailtracker-logo.svg'
    if not os.path.exists(base_svg):
        print(f"✗ Source SVG not found: {base_svg}")
        return False
    
    android_sizes = [
        ('mdpi', 48),
        ('hdpi', 72),
        ('xhdpi', 96),
        ('xxhdpi', 144),
        ('xxxhdpi', 192)
    ]
    
    success = True
    for density, size in android_sizes:
        icon_dir = f'android/app/src/main/res/mipmap-{density}'
        os.makedirs(icon_dir, exist_ok=True)
        
        # Convert regular icon
        png_path = os.path.join(icon_dir, 'ic_launcher.png')
        if not convert_svg_to_png(base_svg, png_path, size):
            success = False
        
        # Convert round icon (same as regular for now)
        png_path_round = os.path.join(icon_dir, 'ic_launcher_round.png')
        if not convert_svg_to_png(base_svg, png_path_round, size):
            success = False
    
    return success

def create_ios_icons():
    """Convert SVG icons for iOS"""
    base_svg = 'assets/tailtracker-logo.svg'
    if not os.path.exists(base_svg):
        print(f"✗ Source SVG not found: {base_svg}")
        return False
    
    ios_sizes = [
        ('Icon-20.png', 20),
        ('Icon-29.png', 29),
        ('Icon-40.png', 40),
        ('Icon-58.png', 58),
        ('Icon-60.png', 60),
        ('Icon-76.png', 76),
        ('Icon-80.png', 80),
        ('Icon-87.png', 87),
        ('Icon-120.png', 120),
        ('Icon-152.png', 152),
        ('Icon-167.png', 167),
        ('Icon-180.png', 180),
        ('Icon-1024.png', 1024)
    ]
    
    icon_dir = 'assets/icons/ios'
    os.makedirs(icon_dir, exist_ok=True)
    
    success = True
    for filename, size in ios_sizes:
        png_path = os.path.join(icon_dir, filename)
        if not convert_svg_to_png(base_svg, png_path, size):
            success = False
    
    return success

def cleanup_svg_files():
    """Remove SVG files from Android mipmap directories"""
    mipmap_dirs = [
        'android/app/src/main/res/mipmap-mdpi',
        'android/app/src/main/res/mipmap-hdpi', 
        'android/app/src/main/res/mipmap-xhdpi',
        'android/app/src/main/res/mipmap-xxhdpi',
        'android/app/src/main/res/mipmap-xxxhdpi'
    ]
    
    for mipmap_dir in mipmap_dirs:
        if os.path.exists(mipmap_dir):
            for file in os.listdir(mipmap_dir):
                if file.endswith('.svg'):
                    svg_file = os.path.join(mipmap_dir, file)
                    os.remove(svg_file)
                    print(f"✓ Removed {svg_file}")

def main():
    print("🚀 TailTracker SVG to PNG Icon Converter")
    print("=" * 50)
    
    # Check and install dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Convert Android icons
    print("\n🤖 Converting Android Icons...")
    if create_android_icons():
        print("✅ Android icons converted successfully")
    else:
        print("❌ Some Android icon conversions failed")
    
    # Convert iOS icons  
    print("\n📱 Converting iOS Icons...")
    if create_ios_icons():
        print("✅ iOS icons converted successfully")
    else:
        print("❌ Some iOS icon conversions failed")
    
    # Cleanup SVG files from Android directories
    print("\n🧹 Cleaning up SVG files from Android directories...")
    cleanup_svg_files()
    
    print("\n✅ Icon conversion complete!")
    print("📝 Next steps:")
    print("   1. Verify PNG files were created in respective directories")
    print("   2. Test app builds with new PNG icons")
    print("   3. Commit changes to repository")

if __name__ == "__main__":
    main()