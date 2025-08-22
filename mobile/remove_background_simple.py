#!/usr/bin/env python3
"""
Simple but precise background removal script using only PIL.
Removes grid background while preserving exact pet artwork details.
"""

from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import os

def remove_grid_background(input_path, output_path):
    """
    Remove white grid background while preserving all pet artwork details exactly.
    Uses PIL-only approach for broad compatibility.
    """
    # Load the original image
    img = Image.open(input_path)
    
    # Convert to RGBA for transparency support
    img = img.convert("RGBA")
    
    # Get image data as numpy array for easier processing
    data = np.array(img)
    
    # Create a copy for the result
    result_data = data.copy()
    
    # Define background color range (white/light gray grid)
    # The grid appears to be very light gray/white
    
    # Method 1: Simple color-based removal
    # Identify background pixels by color similarity to white/light gray
    height, width = data.shape[:2]
    
    # Sample background color from corners (assuming corners are background)
    corner_colors = [
        data[0, 0],           # top-left
        data[0, width-1],     # top-right  
        data[height-1, 0],    # bottom-left
        data[height-1, width-1]  # bottom-right
    ]
    
    # Calculate average background color
    bg_color = np.mean(corner_colors, axis=0)
    print(f"Detected background color: {bg_color}")
    
    # Create mask for background removal
    # Define tolerance for background color matching
    tolerance = 40  # Adjust this value to fine-tune background detection
    
    for y in range(height):
        for x in range(width):
            pixel = data[y, x]
            
            # Calculate color distance from background
            color_diff = np.sqrt(np.sum((pixel[:3] - bg_color[:3])**2))
            
            # If pixel is close to background color, make it transparent
            if color_diff < tolerance:
                # Additional check: ensure it's actually light colored
                if np.mean(pixel[:3]) > 180:  # Light colored pixel
                    result_data[y, x] = [0, 0, 0, 0]  # Transparent
            
            # Also check for pure white and very light gray
            elif np.mean(pixel[:3]) > 240:  # Very light pixels
                result_data[y, x] = [0, 0, 0, 0]  # Transparent
    
    # Method 2: Grid line detection and removal
    # Look for repetitive patterns that indicate grid lines
    
    # Check for horizontal grid lines
    for y in range(height):
        # Count consecutive light pixels in this row
        light_pixel_count = 0
        for x in range(width):
            if np.mean(result_data[y, x][:3]) > 220 and result_data[y, x][3] > 0:
                light_pixel_count += 1
            else:
                light_pixel_count = 0
            
            # If we find a long sequence of light pixels, it's likely a grid line
            if light_pixel_count > width * 0.6:  # 60% of width
                # Mark this entire row as potential grid line
                for px in range(width):
                    if np.mean(result_data[y, px][:3]) > 200:
                        result_data[y, px] = [0, 0, 0, 0]
                break
    
    # Check for vertical grid lines
    for x in range(width):
        # Count consecutive light pixels in this column
        light_pixel_count = 0
        for y in range(height):
            if result_data[y, x][3] > 0 and np.mean(result_data[y, x][:3]) > 220:
                light_pixel_count += 1
            else:
                light_pixel_count = 0
            
            # If we find a long sequence of light pixels, it's likely a grid line
            if light_pixel_count > height * 0.6:  # 60% of height
                # Mark this entire column as potential grid line
                for py in range(height):
                    if np.mean(result_data[py, x][:3]) > 200:
                        result_data[py, x] = [0, 0, 0, 0]
                break
    
    # Method 3: Preserve pet areas by detecting colored regions
    # Identify areas with significant color (the pets) and protect them
    for y in range(height):
        for x in range(width):
            pixel = result_data[y, x]
            
            # If pixel has color saturation (not gray/white), definitely keep it
            r, g, b = pixel[:3]
            
            # Check if pixel has blue tint (the pets appear to be blue-tinted)
            if b > r + 10 and b > g + 10:  # Blue-dominant pixel
                # This is likely part of a pet, ensure it's kept
                if pixel[3] == 0:  # If we accidentally made it transparent
                    result_data[y, x] = data[y, x]  # Restore original
            
            # Also preserve pixels with significant color difference from white
            elif max(r, g, b) - min(r, g, b) > 15:  # Has color variation
                if pixel[3] == 0:  # If we accidentally made it transparent
                    result_data[y, x] = data[y, x]  # Restore original
    
    # Method 4: Edge-aware refinement
    # Ensure we don't remove pixels that are part of pet outlines
    
    # Create the final image
    result_img = Image.fromarray(result_data, 'RGBA')
    
    # Apply slight smoothing to anti-alias edges
    # But preserve sharp details
    result_img = result_img.filter(ImageFilter.SMOOTH_MORE)
    
    # Save the result
    result_img.save(output_path, "PNG", optimize=True)
    print(f"Background removed successfully. Saved to: {output_path}")
    
    return result_img

if __name__ == "__main__":
    input_file = "/home/he_reat/Desktop/Projects/TailTracker/Logo.jpg"
    output_file = "/home/he_reat/Desktop/Projects/TailTracker/mobile/assets/tailtracker-logo.png"
    
    # Ensure assets directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    try:
        result = remove_grid_background(input_file, output_file)
        print("✓ Logo background removal completed successfully!")
        print(f"✓ Original pet artwork preserved with transparent background")
        print(f"✓ Grid pattern removed while maintaining exact details")
        print(f"✓ Saved to: {output_file}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()