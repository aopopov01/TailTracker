#!/bin/bash

# TailTracker Icon Generation Script
# Generates all required app icons and splash screens from the SVG logo

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SVG_SOURCE="$ROOT_DIR/assets/logo/tailtracker-logo.svg"
IOS_ICONS_DIR="$ROOT_DIR/assets/icons/ios"
ANDROID_RES_DIR="$ROOT_DIR/android/app/src/main/res"
SPLASH_DIR="$ROOT_DIR/assets/splash"

# Icon specifications
declare -A IOS_ICONS=(
    ["Icon-1024.png"]="1024"
    ["Icon-180.png"]="180" 
    ["Icon-120.png"]="120"
    ["Icon-167.png"]="167"
    ["Icon-152.png"]="152"
    ["Icon-76.png"]="76"
)

declare -A ANDROID_DENSITIES=(
    ["xxxhdpi"]="192"
    ["xxhdpi"]="144"
    ["xhdpi"]="96"
    ["hdpi"]="72"
    ["mdpi"]="48"
)

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

check_dependencies() {
    log_info "Checking dependencies..."
    
    if [ ! -f "$SVG_SOURCE" ]; then
        log_error "SVG source not found: $SVG_SOURCE"
        exit 1
    fi
    
    # Check for available tools
    CONVERTER=""
    if command -v magick &> /dev/null; then
        CONVERTER="magick"
        log_success "Found ImageMagick 7"
    elif command -v convert &> /dev/null; then
        CONVERTER="convert"
        log_success "Found ImageMagick 6"
    elif command -v inkscape &> /dev/null; then
        CONVERTER="inkscape"
        log_success "Found Inkscape"
    elif command -v rsvg-convert &> /dev/null; then
        CONVERTER="rsvg-convert"
        log_success "Found rsvg-convert"
    else
        log_error "No suitable SVG converter found!"
        log_info "Please install one of the following:"
        echo "  - ImageMagick: sudo apt-get install imagemagick"
        echo "  - Inkscape: sudo apt-get install inkscape"  
        echo "  - librsvg: sudo apt-get install librsvg2-bin"
        exit 1
    fi
}

ensure_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        log_info "Created directory: $1"
    fi
}

convert_svg() {
    local input="$1"
    local output="$2"
    local size="$3"
    local background="$4"
    
    case $CONVERTER in
        "magick"|"convert")
            if [ -n "$background" ]; then
                $CONVERTER "$input" -background "$background" -flatten -resize "${size}x${size}" "$output"
            else
                $CONVERTER "$input" -background transparent -resize "${size}x${size}" "$output"
            fi
            ;;
        "inkscape")
            if [ -n "$background" ]; then
                inkscape "$input" --export-png="$output" --export-width="$size" --export-height="$size" --export-background="$background"
            else
                inkscape "$input" --export-png="$output" --export-width="$size" --export-height="$size"
            fi
            ;;
        "rsvg-convert")
            if [ -n "$background" ]; then
                rsvg-convert "$input" -w "$size" -h "$size" --background-color="$background" -o "$output"
            else
                rsvg-convert "$input" -w "$size" -h "$size" -o "$output"
            fi
            ;;
    esac
}

add_rounded_corners() {
    local input="$1"
    local corner_radius="$2"
    
    if command -v magick &> /dev/null || command -v convert &> /dev/null; then
        local temp_mask=$(mktemp --suffix=.png)
        local temp_rounded=$(mktemp --suffix=.png)
        
        # Create rounded mask
        $CONVERTER -size "${size}x${size}" xc:none -draw "roundrectangle 0,0 $((size-1)),$((size-1)) $corner_radius,$corner_radius" "$temp_mask"
        
        # Apply mask
        $CONVERTER "$input" "$temp_mask" -alpha Off -compose CopyOpacity -composite "$temp_rounded"
        
        mv "$temp_rounded" "$input"
        rm -f "$temp_mask"
    fi
}

generate_ios_icons() {
    log_info "Generating iOS Icons..."
    ensure_dir "$IOS_ICONS_DIR"
    
    for icon_name in "${!IOS_ICONS[@]}"; do
        local size="${IOS_ICONS[$icon_name]}"
        local output_path="$IOS_ICONS_DIR/$icon_name"
        
        convert_svg "$SVG_SOURCE" "$output_path" "$size" "white"
        
        # Add rounded corners for iOS (approximate iOS corner radius)
        if [ "$size" -ge 180 ]; then
            corner_radius=$((size * 2237 / 10000))  # ~22.37% for large icons
        else
            corner_radius=$((size * 1743 / 10000))  # ~17.43% for smaller icons
        fi
        
        add_rounded_corners "$output_path" "$corner_radius"
        
        log_success "Generated: $icon_name (${size}x${size})"
    done
}

generate_android_icons() {
    log_info "Generating Android Icons..."
    
    for density in "${!ANDROID_DENSITIES[@]}"; do
        local size="${ANDROID_DENSITIES[$density]}"
        local density_dir="$ANDROID_RES_DIR/mipmap-$density"
        ensure_dir "$density_dir"
        
        # Standard launcher icon
        convert_svg "$SVG_SOURCE" "$density_dir/ic_launcher.png" "$size"
        log_success "Generated: mipmap-$density/ic_launcher.png (${size}x${size})"
        
        # Round launcher icon
        convert_svg "$SVG_SOURCE" "$density_dir/ic_launcher_round.png" "$size"
        
        # Apply circular mask for round icon
        if command -v magick &> /dev/null || command -v convert &> /dev/null; then
            local temp_mask=$(mktemp --suffix=.png)
            $CONVERTER -size "${size}x${size}" xc:none -fill white -draw "circle $((size/2)),$((size/2)) $((size/2)),0" "$temp_mask"
            $CONVERTER "$density_dir/ic_launcher_round.png" "$temp_mask" -alpha Off -compose CopyOpacity -composite "$density_dir/ic_launcher_round.png"
            rm -f "$temp_mask"
        fi
        
        log_success "Generated: mipmap-$density/ic_launcher_round.png (${size}x${size})"
    done
}

generate_splash_screens() {
    log_info "Generating Splash Screens..."
    ensure_dir "$SPLASH_DIR"
    
    # Light splash screen
    local splash_size=2048
    local logo_size=$((splash_size * 30 / 100))  # 30% of screen size
    
    if command -v magick &> /dev/null || command -v convert &> /dev/null; then
        # Light splash
        $CONVERTER -size "${splash_size}x${splash_size}" xc:white \
                   \( "$SVG_SOURCE" -resize "${logo_size}x${logo_size}" \) \
                   -gravity center -composite "$SPLASH_DIR/splash.png"
        log_success "Generated: splash.png (${splash_size}x${splash_size})"
        
        # Dark splash
        $CONVERTER -size "${splash_size}x${splash_size}" xc:"#1A1A1A" \
                   \( "$SVG_SOURCE" -resize "${logo_size}x${logo_size}" \) \
                   -gravity center -composite "$SPLASH_DIR/splash-dark.png"
        log_success "Generated: splash-dark.png (${splash_size}x${splash_size})"
    else
        log_warning "Cannot create splash screens without ImageMagick. Please create manually."
    fi
}

create_ios_contents_json() {
    log_info "Creating iOS Contents.json..."
    
    cat > "$IOS_ICONS_DIR/Contents.json" << 'EOF'
{
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
}
EOF
    
    log_success "Created Contents.json for iOS icon set"
}

create_android_adaptive_config() {
    log_info "Creating Android adaptive icon configuration..."
    
    # Create adaptive icon directories
    ensure_dir "$ANDROID_RES_DIR/mipmap-anydpi-v26"
    ensure_dir "$ANDROID_RES_DIR/values"
    
    # Adaptive icon XML
    cat > "$ANDROID_RES_DIR/mipmap-anydpi-v26/ic_launcher.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher"/>
</adaptive-icon>
EOF
    
    cat > "$ANDROID_RES_DIR/mipmap-anydpi-v26/ic_launcher_round.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_round"/>
</adaptive-icon>
EOF
    
    # Colors for adaptive icon background
    cat > "$ANDROID_RES_DIR/values/colors.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
EOF
    
    log_success "Created adaptive icon configuration"
}

print_summary() {
    echo
    log_success "Icon Generation Complete!"
    echo
    echo "📱 Generated iOS Icons:"
    for icon_name in "${!IOS_ICONS[@]}"; do
        echo "   - $icon_name (${IOS_ICONS[$icon_name]}x${IOS_ICONS[$icon_name]})"
    done
    
    echo
    echo "🤖 Generated Android Icons:"
    for density in "${!ANDROID_DENSITIES[@]}"; do
        local size="${ANDROID_DENSITIES[$density]}"
        echo "   - mipmap-$density/ic_launcher.png (${size}x${size})"
        echo "   - mipmap-$density/ic_launcher_round.png (${size}x${size})"
    done
    
    echo
    echo "🎨 Generated Splash Screens:"
    echo "   - splash.png (2048x2048) - Light theme"
    echo "   - splash-dark.png (2048x2048) - Dark theme"
    
    echo
    echo "📝 Next Steps:"
    echo "1. For React Native: Update app.json/app.config.js with new icon paths"
    echo "2. For iOS: Add icon files to your Xcode project and update Info.plist"
    echo "3. For Android: Ensure adaptive icon configuration is properly integrated"
    echo "4. Test icons on different devices and screen densities"
    echo "5. Consider creating notification icons and other specialized assets"
}

# Main execution
main() {
    echo "🚀 TailTracker Icon Generator Starting..."
    
    check_dependencies
    generate_ios_icons
    generate_android_icons  
    generate_splash_screens
    create_ios_contents_json
    create_android_adaptive_config
    print_summary
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi