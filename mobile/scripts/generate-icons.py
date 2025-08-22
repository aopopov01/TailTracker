#!/usr/bin/env python3

"""
TailTracker Icon Generation Script

Generates all required app icons and splash screens from the SVG logo
for both iOS and Android platforms following platform-specific guidelines.

Requirements:
- Python 3.6+
- Pillow (pip install pillow)
- cairosvg (pip install cairosvg) 

Usage: python3 generate-icons.py
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Dict, Tuple

try:
    from PIL import Image, ImageDraw, ImageFilter
    import cairosvg
except ImportError as e:
    print(f"❌ Required package not found: {e}")
    print("Please install required packages:")
    print("pip install pillow cairosvg")
    sys.exit(1)

# Paths
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
SVG_SOURCE = ROOT_DIR / "assets/logo/tailtracker-logo.svg"
IOS_ICONS_DIR = ROOT_DIR / "assets/icons/ios"
ANDROID_RES_DIR = ROOT_DIR / "android/app/src/main/res"
SPLASH_DIR = ROOT_DIR / "assets/splash"

# Icon specifications
IOS_ICONS = [
    {"name": "Icon-1024.png", "size": 1024, "description": "App Store icon"},
    {"name": "Icon-180.png", "size": 180, "description": "iPhone app icon @3x"},
    {"name": "Icon-120.png", "size": 120, "description": "iPhone app icon @2x"},
    {"name": "Icon-167.png", "size": 167, "description": "iPad Pro app icon"},
    {"name": "Icon-152.png", "size": 152, "description": "iPad app icon @2x"},
    {"name": "Icon-76.png", "size": 76, "description": "iPad app icon"}
]

ANDROID_ICONS = [
    {"name": "ic_launcher.png", "size": 192, "density": "xxxhdpi", "description": "Android launcher icon xxxhdpi"},
    {"name": "ic_launcher.png", "size": 144, "density": "xxhdpi", "description": "Android launcher icon xxhdpi"},
    {"name": "ic_launcher.png", "size": 96, "density": "xhdpi", "description": "Android launcher icon xhdpi"},
    {"name": "ic_launcher.png", "size": 72, "density": "hdpi", "description": "Android launcher icon hdpi"},
    {"name": "ic_launcher.png", "size": 48, "density": "mdpi", "description": "Android launcher icon mdpi"}
]

SPLASH_SCREENS = [
    {"name": "splash.png", "size": 2048, "background": "#FFFFFF", "description": "Main splash screen"},
    {"name": "splash-dark.png", "size": 2048, "background": "#1A1A1A", "description": "Dark mode splash screen"}
]

def ensure_directory_exists(dir_path: Path) -> None:
    """Create directory if it doesn't exist."""
    if not dir_path.exists():
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {dir_path}")

def check_dependencies() -> None:
    """Check if all required dependencies are available."""
    if not SVG_SOURCE.exists():
        print(f"❌ SVG source not found: {SVG_SOURCE}")
        sys.exit(1)
    
    print("✓ All dependencies found")

def svg_to_png(svg_path: Path, output_path: Path, size: int, background_color: str = None) -> None:
    """Convert SVG to PNG with specified size and optional background."""
    try:
        # Convert SVG to PNG using cairosvg
        png_data = cairosvg.svg2png(
            url=str(svg_path),
            output_width=size,
            output_height=size,
            background_color=background_color
        )
        
        # Load the PNG data with Pillow
        image = Image.open(io.BytesIO(png_data))
        
        # Ensure RGBA mode for transparency support
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # Save the image
        image.save(output_path, "PNG", optimize=True)
        print(f"Generated: {output_path.name} ({size}x{size})")
        
    except Exception as e:
        print(f"❌ Failed to generate {output_path}: {e}")

def create_rounded_icon(image: Image.Image, corner_radius: int) -> Image.Image:
    """Create rounded corners for iOS icons."""
    # Create a mask for rounded corners
    mask = Image.new('L', image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, image.size[0], image.size[1]], corner_radius, fill=255)
    
    # Apply the mask to the image
    rounded_image = Image.new('RGBA', image.size, (255, 255, 255, 0))
    rounded_image.paste(image, (0, 0))
    rounded_image.putalpha(mask)
    
    return rounded_image

def generate_ios_icons() -> None:
    """Generate iOS app icons with proper styling."""
    print("\n📱 Generating iOS Icons...")
    ensure_directory_exists(IOS_ICONS_DIR)
    
    for icon in IOS_ICONS:
        output_path = IOS_ICONS_DIR / icon["name"]
        
        # Convert SVG to PNG
        svg_to_png(SVG_SOURCE, output_path, icon["size"], background_color="white")
        
        # Apply iOS-style rounded corners
        if output_path.exists():
            try:
                image = Image.open(output_path)
                corner_radius = int(icon["size"] * 0.2237) if icon["size"] >= 180 else int(icon["size"] * 0.1743)
                rounded_image = create_rounded_icon(image, corner_radius)
                rounded_image.save(output_path, "PNG", optimize=True)
                print(f"Applied rounded corners: {icon['name']}")
            except Exception as e:
                print(f"Warning: Could not apply rounded corners to {icon['name']}: {e}")

def generate_android_icons() -> None:
    """Generate Android app icons with adaptive icon support."""
    print("\n🤖 Generating Android Icons...")
    
    for icon in ANDROID_ICONS:
        density_dir = ANDROID_RES_DIR / f"mipmap-{icon['density']}"
        ensure_directory_exists(density_dir)
        
        # Generate standard launcher icon
        output_path = density_dir / icon["name"]
        svg_to_png(SVG_SOURCE, output_path, icon["size"])
        
        # Generate round version
        round_output_path = density_dir / "ic_launcher_round.png"
        svg_to_png(SVG_SOURCE, round_output_path, icon["size"])
        
        # Apply circular mask for round icon
        if round_output_path.exists():
            try:
                image = Image.open(round_output_path)
                mask = Image.new('L', image.size, 0)
                draw = ImageDraw.Draw(mask)
                draw.ellipse([0, 0, image.size[0], image.size[1]], fill=255)
                
                round_image = Image.new('RGBA', image.size, (255, 255, 255, 0))
                round_image.paste(image, (0, 0))
                round_image.putalpha(mask)
                round_image.save(round_output_path, "PNG", optimize=True)
                print(f"Applied circular mask: ic_launcher_round.png ({icon['density']})")
            except Exception as e:
                print(f"Warning: Could not apply circular mask: {e}")

def generate_splash_screens() -> None:
    """Generate splash screens for light and dark themes."""
    print("\n🎨 Generating Splash Screens...")
    ensure_directory_exists(SPLASH_DIR)
    
    for splash in SPLASH_SCREENS:
        output_path = SPLASH_DIR / splash["name"]
        
        try:
            # Create background
            background = Image.new('RGB', (splash["size"], splash["size"]), splash["background"])
            
            # Convert SVG to PNG for the logo
            logo_size = int(splash["size"] * 0.3)  # Logo takes 30% of screen
            temp_logo_path = SPLASH_DIR / "temp_logo.png"
            svg_to_png(SVG_SOURCE, temp_logo_path, logo_size)
            
            # Load and center the logo
            if temp_logo_path.exists():
                logo = Image.open(temp_logo_path)
                if logo.mode != 'RGBA':
                    logo = logo.convert('RGBA')
                
                # Calculate center position
                x = (splash["size"] - logo_size) // 2
                y = (splash["size"] - logo_size) // 2
                
                # Paste logo onto background
                background.paste(logo, (x, y), logo)
                background.save(output_path, "PNG", optimize=True)
                
                # Clean up temp file
                temp_logo_path.unlink()
                
                print(f"Generated splash: {splash['name']} ({splash['size']}x{splash['size']}) with {splash['background']} background")
            
        except Exception as e:
            print(f"❌ Failed to generate splash {splash['name']}: {e}")

def generate_icon_set_json() -> None:
    """Generate Contents.json for iOS icon set."""
    icon_set_data = {
        "images": [
            {"idiom": "iphone", "scale": "2x", "size": "20x20", "filename": "Icon-40.png"},
            {"idiom": "iphone", "scale": "3x", "size": "20x20", "filename": "Icon-60.png"},
            {"idiom": "iphone", "scale": "2x", "size": "29x29", "filename": "Icon-58.png"},
            {"idiom": "iphone", "scale": "3x", "size": "29x29", "filename": "Icon-87.png"},
            {"idiom": "iphone", "scale": "2x", "size": "40x40", "filename": "Icon-80.png"},
            {"idiom": "iphone", "scale": "3x", "size": "40x40", "filename": "Icon-120.png"},
            {"idiom": "iphone", "scale": "2x", "size": "60x60", "filename": "Icon-120.png"},
            {"idiom": "iphone", "scale": "3x", "size": "60x60", "filename": "Icon-180.png"},
            {"idiom": "ipad", "scale": "1x", "size": "76x76", "filename": "Icon-76.png"},
            {"idiom": "ipad", "scale": "2x", "size": "76x76", "filename": "Icon-152.png"},
            {"idiom": "ipad", "scale": "2x", "size": "83.5x83.5", "filename": "Icon-167.png"},
            {"idiom": "ios-marketing", "scale": "1x", "size": "1024x1024", "filename": "Icon-1024.png"}
        ],
        "info": {
            "author": "TailTracker Icon Generator",
            "version": 1
        }
    }
    
    contents_path = IOS_ICONS_DIR / "Contents.json"
    with open(contents_path, 'w') as f:
        json.dump(icon_set_data, f, indent=2)
    print("Generated Contents.json for iOS icon set")

def create_adaptive_icon_xml() -> None:
    """Create adaptive icon XML configurations for Android."""
    
    # Adaptive icon background
    adaptive_bg_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>'''
    
    # Adaptive icon round background  
    adaptive_round_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>'''
    
    # Create anydpi-v26 directories
    for density in ['anydpi-v26']:
        density_dir = ANDROID_RES_DIR / f"mipmap-{density}"
        ensure_directory_exists(density_dir)
        
        # Write adaptive icon XMLs
        with open(density_dir / "ic_launcher.xml", 'w') as f:
            f.write(adaptive_bg_xml)
            
        with open(density_dir / "ic_launcher_round.xml", 'w') as f:
            f.write(adaptive_round_xml)
    
    # Create colors.xml for background color
    values_dir = ANDROID_RES_DIR / "values"
    ensure_directory_exists(values_dir)
    
    colors_xml = '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>'''
    
    with open(values_dir / "colors.xml", 'w') as f:
        f.write(colors_xml)
    
    print("Generated adaptive icon XML configurations")

def print_summary() -> None:
    """Print generation summary and next steps."""
    print("\n✅ Icon Generation Complete!")
    print("\nGenerated Files:")
    print("📱 iOS Icons:")
    for icon in IOS_ICONS:
        print(f"   - {icon['name']} ({icon['size']}x{icon['size']}) - {icon['description']}")
    
    print("\n🤖 Android Icons:")
    for icon in ANDROID_ICONS:
        print(f"   - mipmap-{icon['density']}/{icon['name']} ({icon['size']}x{icon['size']}) - {icon['description']}")
        print(f"   - mipmap-{icon['density']}/ic_launcher_round.png ({icon['size']}x{icon['size']}) - Round version")
    
    print("\n🎨 Splash Screens:")
    for splash in SPLASH_SCREENS:
        print(f"   - {splash['name']} ({splash['size']}x{splash['size']}) - {splash['description']}")
    
    print("\n📝 Next Steps:")
    print("1. For React Native: Update app.json/app.config.js with new icon paths")
    print("2. For iOS: Add icon files to your Xcode project")
    print("3. For Android: Ensure adaptive icon configuration is properly set up")
    print("4. Test icons on different devices and screen densities")
    print("5. Consider creating notification icons and other app-specific assets")

def main() -> None:
    """Main execution function."""
    print("🚀 TailTracker Icon Generator Starting...")
    
    check_dependencies()
    generate_ios_icons()
    generate_android_icons()
    generate_splash_screens()
    generate_icon_set_json()
    create_adaptive_icon_xml()
    print_summary()

if __name__ == "__main__":
    # Add io import needed for BytesIO
    import io
    main()