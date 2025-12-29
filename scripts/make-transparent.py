#!/usr/bin/env python3
"""
Script to remove backgrounds from pet icon images.
Run: pip3 install pillow && python3 scripts/make-transparent.py
"""

from PIL import Image
import os

# Project paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_DIR = PROJECT_ROOT
TARGET_DIR = os.path.join(PROJECT_ROOT, 'apps', 'web', 'public', 'images', 'pets')

# Images to process
IMAGES = {
    'Logo.png': 'Logo.png',
    'Dog.jpeg': 'Dog.png',  # Convert JPEG to PNG for transparency
    'Cat.jpeg': 'Cat.png',
    'Bird.jpeg': 'Bird.png',
}

def remove_background(image_path, output_path, fuzz=30):
    """Remove background from an image by making similar colors transparent."""
    img = Image.open(image_path).convert('RGBA')
    data = img.getdata()

    # Get the background color from corner pixels
    width, height = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((width-1, 0)),
        img.getpixel((0, height-1)),
        img.getpixel((width-1, height-1))
    ]

    # Average the corner colors to estimate background
    bg_r = sum(c[0] for c in corners) // 4
    bg_g = sum(c[1] for c in corners) // 4
    bg_b = sum(c[2] for c in corners) // 4

    print(f"  Detected background color: RGB({bg_r}, {bg_g}, {bg_b})")

    new_data = []
    for item in data:
        r, g, b = item[0], item[1], item[2]

        # Check if pixel is similar to background color
        if (abs(r - bg_r) < fuzz and
            abs(g - bg_g) < fuzz and
            abs(b - bg_b) < fuzz):
            # Make transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, 'PNG')
    print(f"  Saved with transparent background: {output_path}")

def main():
    print("=" * 60)
    print("TailTracker - PNG Background Remover")
    print("=" * 60)

    os.makedirs(TARGET_DIR, exist_ok=True)

    for source_file, target_file in IMAGES.items():
        source_path = os.path.join(SOURCE_DIR, source_file)
        target_path = os.path.join(TARGET_DIR, target_file)

        if not os.path.exists(source_path):
            print(f"\n[SKIP] Source not found: {source_file}")
            continue

        print(f"\n[PROCESSING] {source_file} -> {target_file}")
        try:
            remove_background(source_path, target_path)
        except Exception as e:
            print(f"  [ERROR] Failed: {e}")

    print("\n" + "=" * 60)
    print("Done! Rebuild Docker to see changes:")
    print("  docker-compose -f docker-compose.dev.yml up --build -d")
    print("=" * 60)

if __name__ == '__main__':
    main()
