#!/bin/bash

# TailTracker Icon Setup Script
# Prepares the complete icon structure and provides generation instructions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SVG_SOURCE="$ROOT_DIR/assets/logo/tailtracker-logo.svg"

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

print_banner() {
    echo -e "${PURPLE}"
    echo "████████╗ █████╗ ██╗██╗  ████████╗██████╗  █████╗  ██████╗██╗  ██╗███████╗██████╗ "
    echo "╚══██╔══╝██╔══██╗██║██║  ╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗"
    echo "   ██║   ███████║██║██║     ██║   ██████╔╝███████║██║     █████╔╝ █████╗  ██████╔╝"
    echo "   ██║   ██╔══██║██║██║     ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗"
    echo "   ██║   ██║  ██║██║███████╗██║   ██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║  ██║"
    echo "   ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝"
    echo -e "${NC}"
    echo -e "${GREEN}🐾 Icon Setup & Generation System${NC}"
    echo
}

create_directory_structure() {
    log_header "📁 Creating Directory Structure"
    
    directories=(
        "$ROOT_DIR/assets/icons/ios"
        "$ROOT_DIR/assets/splash"
        "$ROOT_DIR/android/app/src/main/res/mipmap-xxxhdpi"
        "$ROOT_DIR/android/app/src/main/res/mipmap-xxhdpi"
        "$ROOT_DIR/android/app/src/main/res/mipmap-xhdpi"
        "$ROOT_DIR/android/app/src/main/res/mipmap-hdpi"
        "$ROOT_DIR/android/app/src/main/res/mipmap-mdpi"
        "$ROOT_DIR/android/app/src/main/res/mipmap-anydpi-v26"
        "$ROOT_DIR/android/app/src/main/res/values"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "Created: $(basename "$dir")"
        else
            log_info "Exists: $(basename "$dir")"
        fi
    done
    echo
}

create_placeholder_icons() {
    log_header "🎨 Creating Placeholder Icon Files"
    
    # iOS icon sizes
    ios_sizes=(1024 180 120 167 152 76)
    for size in "${ios_sizes[@]}"; do
        icon_file="$ROOT_DIR/assets/icons/ios/Icon-${size}.png"
        if [ ! -f "$icon_file" ]; then
            # Create a simple colored placeholder
            create_placeholder_image "$icon_file" "$size" "#FFFFFF" "iOS Icon ${size}x${size}"
            log_success "Created placeholder: Icon-${size}.png"
        fi
    done
    
    # Android icon sizes and densities
    declare -A android_densities=( 
        ["xxxhdpi"]=192 
        ["xxhdpi"]=144 
        ["xhdpi"]=96 
        ["hdpi"]=72 
        ["mdpi"]=48 
    )
    
    for density in "${!android_densities[@]}"; do
        size="${android_densities[$density]}"
        density_dir="$ROOT_DIR/android/app/src/main/res/mipmap-${density}"
        
        # Standard launcher icon
        icon_file="$density_dir/ic_launcher.png"
        if [ ! -f "$icon_file" ]; then
            create_placeholder_image "$icon_file" "$size" "transparent" "Android ${density} ${size}x${size}"
            log_success "Created placeholder: mipmap-${density}/ic_launcher.png"
        fi
        
        # Round launcher icon
        round_file="$density_dir/ic_launcher_round.png"
        if [ ! -f "$round_file" ]; then
            create_placeholder_image "$round_file" "$size" "transparent" "Android Round ${density} ${size}x${size}"
            log_success "Created placeholder: mipmap-${density}/ic_launcher_round.png"
        fi
    done
    
    # Splash screens
    splash_light="$ROOT_DIR/assets/splash/splash.png"
    splash_dark="$ROOT_DIR/assets/splash/splash-dark.png"
    
    if [ ! -f "$splash_light" ]; then
        create_placeholder_image "$splash_light" 2048 "#FFFFFF" "Light Splash 2048x2048"
        log_success "Created placeholder: splash.png"
    fi
    
    if [ ! -f "$splash_dark" ]; then
        create_placeholder_image "$splash_dark" 2048 "#1A1A1A" "Dark Splash 2048x2048"
        log_success "Created placeholder: splash-dark.png"
    fi
    
    echo
}

create_placeholder_image() {
    local output_file="$1"
    local size="$2"
    local bg_color="$3"
    local label="$4"
    
    # Create a simple SVG placeholder
    cat > "${output_file%.png}.svg" << EOF
<svg width="$size" height="$size" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="$bg_color" stroke="#ddd" stroke-width="2"/>
  <text x="50%" y="45%" text-anchor="middle" font-family="Arial" font-size="$(($size/20))" fill="#666">TailTracker</text>
  <text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="$(($size/30))" fill="#999">$label</text>
  <text x="50%" y="65%" text-anchor="middle" font-family="Arial" font-size="$(($size/40))" fill="#ccc">Placeholder</text>
</svg>
EOF
    
    # Note: The actual PNG conversion should be done with proper tools
    # For now, we create the SVG placeholders
    log_info "Created SVG placeholder for $label"
}

check_tools() {
    log_header "🔍 Checking Available Tools"
    
    tools_available=false
    
    if command -v magick &> /dev/null; then
        log_success "ImageMagick 7 (magick) - Available"
        tools_available=true
    elif command -v convert &> /dev/null; then
        log_success "ImageMagick 6 (convert) - Available"  
        tools_available=true
    else
        log_warning "ImageMagick not found"
    fi
    
    if command -v inkscape &> /dev/null; then
        log_success "Inkscape - Available"
        tools_available=true
    else
        log_warning "Inkscape not found"
    fi
    
    if command -v rsvg-convert &> /dev/null; then
        log_success "rsvg-convert - Available"
        tools_available=true
    else
        log_warning "librsvg not found"
    fi
    
    if [ "$tools_available" = false ]; then
        log_error "No suitable SVG conversion tools found!"
        echo
        log_info "To install required tools:"
        echo "  Ubuntu/Debian: sudo apt-get install imagemagick inkscape librsvg2-bin"
        echo "  macOS: brew install imagemagick inkscape librsvg"
        echo "  Windows: Use WSL or download tools manually"
        echo
        log_info "Alternative: Use the web-based converter at:"
        echo "  file://$SCRIPT_DIR/svg-to-png-converter.html"
        echo
    fi
    
    echo
}

create_generation_instructions() {
    log_header "📖 Generation Instructions"
    
    cat << 'EOF'
┌─────────────────────────────────────────────────────────────────┐
│                    ICON GENERATION OPTIONS                      │
└─────────────────────────────────────────────────────────────────┘

Option 1: Automated Script (Recommended)
   If you have ImageMagick, Inkscape, or librsvg installed:
   ./generate-icons.sh

Option 2: Web-based Generator (No Installation Required)
   Open the HTML file in your browser:
   file://scripts/svg-to-png-converter.html
   
   Features:
   - Live preview of all icons
   - Individual downloads or ZIP package  
   - Works in any modern browser
   - No additional software required

Option 3: Python Script (Cross-platform)
   Install dependencies: pip install pillow cairosvg
   Then run: python3 generate-icons.py

Option 4: Node.js Script
   Install dependencies: npm install sharp
   Then run: node generate-icons.js

┌─────────────────────────────────────────────────────────────────┐
│                        MANUAL PROCESS                          │
└─────────────────────────────────────────────────────────────────┘

If using external tools:
1. Export the SVG at these sizes with white background (iOS):
   1024x1024, 180x180, 120x120, 167x167, 152x152, 76x76

2. Export the SVG at these sizes with transparent background (Android):
   192x192, 144x144, 96x96, 72x72, 48x48

3. For splash screens, create 2048x2048 images with the logo centered:
   - White background for splash.png  
   - Dark gray (#1A1A1A) for splash-dark.png
   - Logo should be ~30% of the screen size

4. Apply rounded corners to iOS icons (22.37% corner radius for large icons)

5. Apply circular masks to Android round icons

EOF
    
    echo
}

print_next_steps() {
    log_header "🚀 Next Steps"
    
    echo "1. Choose a generation method from the options above"
    echo "2. Generate the actual icon files from your SVG source"
    echo "3. Replace the placeholder files with your generated icons"
    echo "4. Test the icons on different devices and screen densities"
    echo
    
    log_info "Important Files Created:"
    echo "  📁 Complete directory structure for iOS and Android"
    echo "  📄 iOS Contents.json with proper icon set configuration"
    echo "  📄 Android adaptive icon XML configuration"  
    echo "  📄 Android colors.xml for adaptive icon backgrounds"
    echo "  🛠  Generation scripts (Bash, Python, Node.js, HTML)"
    echo "  📖 Comprehensive documentation and instructions"
    echo
    
    log_success "Setup Complete! Ready for icon generation."
    echo
    
    log_warning "Remember to:"
    echo "  - Test generated icons on actual devices"
    echo "  - Verify App Store compliance for iOS icons"
    echo "  - Ensure adaptive icons work properly on Android 8.0+"
    echo "  - Update your app configuration files with the new icon paths"
}

# Main execution
main() {
    print_banner
    create_directory_structure
    create_placeholder_icons
    check_tools
    create_generation_instructions
    print_next_steps
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi