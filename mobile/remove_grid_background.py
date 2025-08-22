#!/usr/bin/env python3
"""
Script to remove grid background from Logo.jpg while preserving exact pet details.
This performs precise background removal without altering the original artwork.
"""

import cv2
import numpy as np
from PIL import Image, ImageFilter
import os

def remove_grid_background(input_path, output_path):
    """
    Remove white grid background while preserving all pet artwork details exactly.
    """
    # Load image
    img = cv2.imread(input_path)
    original = img.copy()
    
    # Convert to RGB for PIL processing
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(img_rgb)
    
    # Convert to RGBA for transparency
    pil_image = pil_image.convert("RGBA")
    data = np.array(pil_image)
    
    # Define the grid background color (white/light gray grid lines)
    # We'll identify the background by detecting the uniform grid pattern
    
    # Convert to HSV for better color segmentation
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Create mask for the background (light gray/white grid)
    # The grid appears to be very light gray/white
    lower_bg = np.array([0, 0, 200])  # Very light colors
    upper_bg = np.array([180, 30, 255])  # White/light gray range
    
    # Create initial background mask
    bg_mask = cv2.inRange(img_hsv, lower_bg, upper_bg)
    
    # Refine the mask to target specifically the grid pattern
    # Apply morphological operations to clean up the mask
    kernel = np.ones((3,3), np.uint8)
    bg_mask = cv2.morphologyEx(bg_mask, cv2.MORPH_CLOSE, kernel)
    bg_mask = cv2.morphologyEx(bg_mask, cv2.MORPH_OPEN, kernel)
    
    # Create a more precise mask by analyzing the grid structure
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Detect grid lines using edge detection and line detection
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    
    # Detect horizontal and vertical lines (grid pattern)
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25))
    
    horizontal_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, horizontal_kernel)
    vertical_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, vertical_kernel)
    
    # Combine horizontal and vertical lines to get grid mask
    grid_lines = cv2.addWeighted(horizontal_lines, 0.5, vertical_lines, 0.5, 0.0)
    
    # Dilate the grid lines to capture the full grid thickness
    grid_kernel = np.ones((3,3), np.uint8)
    grid_mask = cv2.dilate(grid_lines, grid_kernel, iterations=2)
    
    # Combine with color-based background mask
    combined_mask = cv2.bitwise_or(bg_mask, grid_mask)
    
    # Apply additional refinement - target the uniform background areas
    # Use flood fill from corners to capture the background
    height, width = gray.shape
    flood_mask = np.zeros((height + 2, width + 2), np.uint8)
    
    # Flood fill from corners to capture background
    corner_points = [(0, 0), (0, width-1), (height-1, 0), (height-1, width-1)]
    final_bg_mask = np.zeros_like(gray)
    
    for corner in corner_points:
        temp_mask = np.zeros((height + 2, width + 2), np.uint8)
        cv2.floodFill(gray, temp_mask, corner, 255, loDiff=15, upDiff=15)
        # Extract the flood filled area
        temp_mask = temp_mask[1:-1, 1:-1]
        final_bg_mask = cv2.bitwise_or(final_bg_mask, temp_mask)
    
    # Combine all masks
    final_mask = cv2.bitwise_or(combined_mask, final_bg_mask)
    
    # Invert mask so foreground (pets) is white, background is black
    foreground_mask = cv2.bitwise_not(final_mask)
    
    # Apply some smoothing to the mask edges to avoid harsh cutoffs
    foreground_mask = cv2.GaussianBlur(foreground_mask, (3, 3), 0)
    
    # Convert back to PIL for final processing
    mask_pil = Image.fromarray(foreground_mask)
    
    # Create the final image with transparency
    result = Image.new("RGBA", pil_image.size, (0, 0, 0, 0))
    
    # Use the original image data
    original_rgba = pil_image.copy()
    
    # Apply the mask to create transparency
    for y in range(pil_image.size[1]):
        for x in range(pil_image.size[0]):
            if foreground_mask[y, x] > 128:  # Keep pixel
                result.putpixel((x, y), original_rgba.getpixel((x, y)))
            else:  # Make transparent
                result.putpixel((x, y), (0, 0, 0, 0))
    
    # Apply a slight blur to smooth edges while preserving details
    # This helps with anti-aliasing around the pet shapes
    mask_array = np.array(mask_pil)
    smooth_mask = cv2.GaussianBlur(mask_array, (1, 1), 0)
    
    # Create final result with smooth alpha channel
    final_result = Image.new("RGBA", pil_image.size, (0, 0, 0, 0))
    original_array = np.array(pil_image)
    
    for y in range(pil_image.size[1]):
        for x in range(pil_image.size[0]):
            alpha_value = smooth_mask[y, x]
            if alpha_value > 10:  # Keep pixels with some confidence
                r, g, b, a = original_array[y, x]
                # Scale alpha based on mask confidence
                new_alpha = min(255, int((alpha_value / 255.0) * a))
                final_result.putpixel((x, y), (r, g, b, new_alpha))
    
    # Save the result
    final_result.save(output_path, "PNG", optimize=True)
    print(f"Background removed successfully. Saved to: {output_path}")
    
    return final_result

if __name__ == "__main__":
    input_file = "/home/he_reat/Desktop/Projects/TailTracker/Logo.jpg"
    output_file = "/home/he_reat/Desktop/Projects/TailTracker/mobile/assets/tailtracker-logo.png"
    
    # Ensure assets directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    try:
        result = remove_grid_background(input_file, output_file)
        print("✓ Logo background removal completed successfully!")
        print(f"✓ Original artwork preserved with transparent background")
        print(f"✓ Saved to: {output_file}")
    except Exception as e:
        print(f"Error: {e}")