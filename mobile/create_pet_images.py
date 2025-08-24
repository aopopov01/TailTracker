#!/usr/bin/env python3
"""
Script to create individual pet images from the TailTracker logo
"""
import os
from PIL import Image, ImageDraw

# Create the assets directory if it doesn't exist
assets_dir = '/home/he_reat/Desktop/Projects/TailTracker/mobile/assets/images/pets'
os.makedirs(assets_dir, exist_ok=True)

# Define colors from the TailTracker brand
COLORS = {
    'light_cyan': '#5DD4DC',
    'mid_cyan': '#4BA8B5', 
    'deep_navy': '#1B3A57',
    'white': '#FFFFFF'
}

def create_rounded_square(size, color, border_radius=20):
    """Create a rounded square background"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle
    draw.rounded_rectangle(
        [0, 0, size-1, size-1], 
        radius=border_radius, 
        fill=color
    )
    return img

def create_dog_silhouette(size):
    """Create a simple dog silhouette"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Simple dog silhouette (side profile)
    # Head circle
    head_size = size // 3
    draw.ellipse([size//4, size//4, size//4 + head_size, size//4 + head_size], fill='white')
    
    # Snout
    draw.ellipse([size//4 + head_size//2, size//4 + head_size//3, 
                  size//4 + head_size + 20, size//4 + head_size//2], fill='white')
    
    # Ear
    draw.ellipse([size//4 + 10, size//4 - 10, 
                  size//4 + head_size//2, size//4 + head_size//3], fill='white')
    
    # Body
    draw.ellipse([size//4 - 20, size//4 + head_size//2, 
                  size//4 + head_size + 10, size - size//4], fill='white')
    
    # Tail (curved line simulation with ellipse)
    draw.ellipse([size//4 + head_size - 10, size//4 + head_size//3, 
                  size//4 + head_size + 15, size//2], fill='white')
    
    return img

def create_cat_silhouette(size):
    """Create a simple cat silhouette"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Cat sitting profile
    # Head circle
    head_size = size // 3
    draw.ellipse([size//3, size//4, size//3 + head_size, size//4 + head_size], fill='white')
    
    # Pointed ears
    ear_points = [
        [size//3 + 5, size//4],
        [size//3 + 15, size//4 - 15],
        [size//3 + 25, size//4 + 5]
    ]
    draw.polygon(ear_points, fill='white')
    
    ear_points2 = [
        [size//3 + head_size - 25, size//4 + 5],
        [size//3 + head_size - 15, size//4 - 15],
        [size//3 + head_size - 5, size//4]
    ]
    draw.polygon(ear_points2, fill='white')
    
    # Body (sitting position)
    draw.ellipse([size//3 - 10, size//4 + head_size//2, 
                  size//3 + head_size + 10, size - size//5], fill='white')
    
    # Tail (curved)
    tail_points = [
        [size//3 + head_size, size - size//3],
        [size//3 + head_size + 20, size - size//2],
        [size//3 + head_size - 10, size - size//4]
    ]
    for i in range(len(tail_points) - 1):
        draw.line([tail_points[i], tail_points[i+1]], fill='white', width=8)
    
    return img

def create_parrot_silhouette(size):
    """Create a simple parrot silhouette"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Parrot profile
    # Head
    head_size = size // 3
    draw.ellipse([size//3, size//4, size//3 + head_size, size//4 + head_size], fill='white')
    
    # Curved beak
    beak_points = [
        [size//3 + head_size, size//4 + head_size//2],
        [size//3 + head_size + 15, size//4 + head_size//2 + 10],
        [size//3 + head_size + 5, size//4 + head_size//2 + 15]
    ]
    draw.polygon(beak_points, fill='white')
    
    # Crest feathers on top
    crest_points = [
        [size//3 + head_size//3, size//4 - 5],
        [size//3 + head_size//2, size//4 - 20],
        [size//3 + 2*head_size//3, size//4 - 5]
    ]
    draw.polygon(crest_points, fill='white')
    
    # Body
    draw.ellipse([size//3 - 5, size//4 + head_size//2, 
                  size//3 + head_size - 5, size - size//4], fill='white')
    
    # Wing detail
    draw.ellipse([size//3, size//4 + head_size//2 + 10, 
                  size//3 + head_size//2, size - size//3], fill='white')
    
    return img

def create_pet_icon(pet_type, size=100):
    """Create a pet icon with background and silhouette"""
    # Create background with gradient effect (simplified as solid color)
    if pet_type == 'dog':
        bg_color = COLORS['light_cyan']
        silhouette = create_dog_silhouette(size)
    elif pet_type == 'cat':
        bg_color = COLORS['mid_cyan']
        silhouette = create_cat_silhouette(size)
    elif pet_type == 'parrot':
        bg_color = COLORS['deep_navy']
        silhouette = create_parrot_silhouette(size)
    else:
        bg_color = COLORS['mid_cyan']
        silhouette = create_dog_silhouette(size)
    
    # Create background
    background = create_rounded_square(size, bg_color)
    
    # Composite silhouette on background
    final_img = Image.alpha_composite(background, silhouette)
    
    return final_img

# Create pet icons
pets = ['dog', 'cat', 'parrot']
sizes = [64, 128, 256]  # Different sizes for different screen densities

for pet in pets:
    for size in sizes:
        icon = create_pet_icon(pet, size)
        filename = f'{pet}_{size}.png'
        filepath = os.path.join(assets_dir, filename)
        icon.save(filepath, 'PNG')
        print(f'Created: {filepath}')

print(f'\nAll pet icons created in: {assets_dir}')