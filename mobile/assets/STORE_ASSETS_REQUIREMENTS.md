# TailTracker Store Assets Requirements

**Date:** January 20, 2025  
**Platforms:** Apple App Store, Google Play Store  
**Status:** Ready for Asset Creation

## Apple App Store Assets

### App Icons

#### Requirements:
- **App Store Icon**: 1024×1024 pixels, PNG format
- **No transparency, no rounded corners** (Apple adds automatically)
- **High resolution, sharp graphics**
- **Consistent with app branding**

#### Specifications:
```
Format: PNG
Size: 1024×1024 pixels (exactly)
Color Space: sRGB or P3
Compression: None or minimal
File Size: <500KB recommended
```

#### Design Guidelines:
- Simple, memorable design that works at small sizes
- Clear representation of pet tracking/management concept
- Consistent with TailTracker brand colors
- Avoid text or detailed graphics that become illegible when scaled

### Screenshots

#### iPhone 6.7" (iPhone 14 Pro Max) - REQUIRED
- **Dimensions**: 1290×2796 pixels or 2796×1290 pixels
- **Format**: PNG or JPEG
- **Quantity**: 3-10 screenshots
- **Purpose**: Primary display size for App Store

#### iPhone 6.5" (iPhone XS Max) - REQUIRED  
- **Dimensions**: 1242×2688 pixels or 2688×1242 pixels
- **Format**: PNG or JPEG
- **Quantity**: 3-10 screenshots
- **Purpose**: Large iPhone compatibility

#### iPhone 5.5" (iPhone 8 Plus) - REQUIRED
- **Dimensions**: 1242×2208 pixels or 2208×1242 pixels
- **Format**: PNG or JPEG
- **Quantity**: 3-10 screenshots
- **Purpose**: Legacy iPhone support

#### iPad 12.9" (iPad Pro) - RECOMMENDED
- **Dimensions**: 2048×2732 pixels or 2732×2048 pixels
- **Format**: PNG or JPEG
- **Quantity**: 2-10 screenshots
- **Purpose**: iPad optimization showcase

### App Previews (Optional but Recommended)

#### Specifications:
- **Duration**: 15-30 seconds
- **Format**: M4V, MP4, or MOV
- **Resolution**: Match screenshot dimensions
- **File Size**: <500MB
- **Audio**: Optional, no copyrighted music

#### Content Guidelines:
- Show actual app functionality
- Focus on key features (pet tracking, health records)
- No marketing speak or external references
- Portrait orientation preferred

## Google Play Store Assets

### App Icons

#### High-Resolution Icon
- **Size**: 512×512 pixels
- **Format**: PNG (32-bit with transparency)
- **Purpose**: Play Store listing display

#### Adaptive Icon (Android 8.0+)
- **Foreground**: 512×512 pixels, PNG with transparency
- **Background**: 512×512 pixels, PNG or solid color
- **Safe Zone**: 108×108dp inner circle for important elements
- **Purpose**: Dynamic icon shapes on different devices

### Screenshots

#### Phone Screenshots (REQUIRED)
- **Minimum**: 2 screenshots
- **Maximum**: 8 screenshots  
- **Format**: PNG or JPEG
- **Dimensions**: 
  - 16:9 aspect ratio: 1920×1080 minimum
  - 9:16 aspect ratio: 1080×1920 minimum
- **File Size**: <8MB each

#### 7-inch Tablet Screenshots (OPTIONAL)
- **Format**: PNG or JPEG
- **Minimum**: 1024×600 pixels
- **Maximum**: 7680×4320 pixels

#### 10-inch Tablet Screenshots (OPTIONAL)
- **Format**: PNG or JPEG  
- **Minimum**: 1024×768 pixels
- **Maximum**: 7680×4320 pixels

### Feature Graphic
- **Size**: 1024×500 pixels (exactly)
- **Format**: PNG or JPEG
- **Purpose**: Featured placement on Google Play
- **Requirements**: High quality, no text overlay

### Promotional Video (OPTIONAL)
- **Platform**: YouTube
- **Duration**: 30 seconds - 2 minutes
- **Content**: Demonstrate key app features
- **Purpose**: Enhanced store listing engagement

## Content Strategy for Screenshots

### Screenshot #1: Home/Dashboard
**Purpose**: Show main interface and core value proposition
**Elements**:
- Pet profiles with photos
- Quick action buttons (Add Pet, Track Location)
- Clean, intuitive navigation
- Premium/Free tier indication

### Screenshot #2: Pet Tracking Map
**Purpose**: Demonstrate location tracking capabilities  
**Elements**:
- Map with pet location marker
- Safe zone boundaries (geofenced areas)
- Real-time tracking indicators
- Battery-friendly tracking badge

### Screenshot #3: Pet Profile Management
**Purpose**: Show comprehensive pet information features
**Elements**:
- Pet photo gallery
- Health records and vaccination tracking
- Medication reminders
- Emergency contact information

### Screenshot #4: Family Sharing
**Purpose**: Highlight collaboration features
**Elements**:
- Multiple family members
- Shared pet access permissions
- Notification preferences
- Emergency contact system

### Screenshot #5: Premium Features
**Purpose**: Showcase subscription benefits
**Elements**:
- Unlimited pet profiles
- Extended location history
- Advanced analytics
- Premium badge/indicators

### Text Overlays (If Used)
- Keep minimal and legible
- Use high contrast colors
- Ensure readability at small sizes
- Comply with platform guidelines

## Asset Creation Guidelines

### Brand Consistency
- **Primary Colors**: #2E7D5F (Green), #1A4B3A (Dark Green)
- **Secondary Colors**: #F5F5F5 (Light Gray), #333333 (Dark Gray)  
- **Accent Color**: #FF6B6B (Alert Red)
- **Typography**: SF Pro (iOS), Roboto (Android)

### Image Quality Standards
- **Resolution**: Always use highest required resolution
- **Compression**: Minimal compression to maintain quality
- **Color Space**: sRGB for compatibility
- **Text Legibility**: 14pt minimum for any text in images

### Localization Considerations
- Create assets for primary markets (English, Spanish, French, German)
- Consider cultural sensitivities in pet representation
- Ensure text translations fit within design constraints

## Screenshot Mockup Generation

### Tools and Resources
- **Figma/Sketch**: Design tool integration
- **App Store Screenshot Template**: Official Apple templates
- **Device Frames**: Current device bezels and frames
- **Screenshot Automation**: Fastlane for automated generation

### Testing on Devices
- Test screenshot legibility on actual devices
- Verify color accuracy across different screens  
- Check touch target visibility and sizing
- Validate with different accessibility settings

## Asset Validation Checklist

### Apple App Store
- [ ] App Store icon: 1024×1024, PNG, no transparency
- [ ] iPhone 6.7" screenshots: 1290×2796, 3+ images
- [ ] iPhone 6.5" screenshots: 1242×2688, 3+ images  
- [ ] iPhone 5.5" screenshots: 1242×2208, 3+ images
- [ ] iPad screenshots: 2048×2732, 2+ images (if iPad supported)
- [ ] App previews: <30 seconds, appropriate format (optional)
- [ ] All assets follow Apple Human Interface Guidelines

### Google Play Store  
- [ ] High-res icon: 512×512, PNG with transparency
- [ ] Adaptive icon: Foreground and background layers
- [ ] Phone screenshots: 2-8 images, 1080×1920 minimum
- [ ] Feature graphic: 1024×500, high quality
- [ ] Tablet screenshots: appropriate sizes (optional)
- [ ] Promotional video: YouTube link (optional)
- [ ] All assets follow Material Design guidelines

### Cross-Platform Validation
- [ ] Brand consistency across both stores
- [ ] Screenshots accurately represent app functionality
- [ ] No misleading or exaggerated claims in visuals
- [ ] Accessibility considerations in all visual assets
- [ ] Legal compliance (no copyrighted content)

## Asset Management

### File Organization
```
/assets/
├── app-store/
│   ├── icons/
│   │   └── app-store-icon-1024.png
│   ├── screenshots/
│   │   ├── iphone-6.7/
│   │   ├── iphone-6.5/
│   │   ├── iphone-5.5/
│   │   └── ipad-12.9/
│   └── previews/
├── play-store/
│   ├── icons/
│   │   ├── high-res-icon-512.png
│   │   ├── adaptive-foreground-512.png
│   │   └── adaptive-background-512.png
│   ├── screenshots/
│   │   ├── phone/
│   │   ├── tablet-7/
│   │   └── tablet-10/
│   └── feature-graphic-1024x500.png
└── source-files/
    ├── figma-designs.fig
    ├── sketch-files.sketch
    └── asset-exports/
```

### Version Control
- Track all asset changes in version control
- Maintain source files alongside exported assets
- Tag releases with corresponding asset versions
- Document changes and rationale for updates

## Timeline and Priorities

### Phase 1: Critical Assets (2 days)
1. App Store icon design and optimization
2. Core iPhone screenshots (6.7", 6.5", 5.5")  
3. Google Play high-res and adaptive icons
4. Essential Play Store phone screenshots

### Phase 2: Enhanced Assets (1 day)
1. iPad screenshots for better App Store placement
2. Google Play feature graphic
3. Additional screenshot variations
4. Asset quality review and optimization

### Phase 3: Optional Enhancements (1 day)
1. App preview videos for both stores
2. Tablet screenshots for Google Play
3. Promotional video creation
4. Localized asset variants

**Total Timeline**: 4 days for complete asset creation

## Success Metrics

### App Store Performance
- Click-through rate from store browse to app page
- Conversion rate from app page view to download
- User ratings and reviews mentioning app presentation
- Featured placement eligibility

### Google Play Performance
- Install conversion rate
- Store listing experiments performance
- Pre-registration numbers (if applicable)
- Play Pass eligibility (premium features)

---

**Asset Creation Status**: Ready to begin  
**Design Resources**: Brand guidelines established  
**Technical Requirements**: All specifications documented  
**Next Steps**: Begin asset creation following this specification

**Contact**: App Store Compliance Specialist  
**Review Date**: January 20, 2025