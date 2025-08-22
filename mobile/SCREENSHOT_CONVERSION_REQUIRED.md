# Screenshot Conversion Required

## Critical Compliance Issue - SVG Screenshots

**ISSUE**: App store submission requires PNG or JPG format for screenshots, not SVG.

### Current SVG Screenshots Found:
- iOS: 7 screenshots in `screenshots/ios/`
- Android: 4 screenshots in `screenshots/android/`

### Required Actions:

1. **Convert to Proper Formats**:
   - iOS App Store: PNG format required
   - Google Play Store: PNG or JPG format required
   - Minimum resolution requirements vary by device class

2. **Use the HTML Converter**:
   - Open `icon_converter.html` in a web browser
   - Upload each SVG screenshot
   - Generate and download as PNG
   - Place in respective screenshot directories

3. **Screenshot Requirements**:
   - **iOS iPhone 6.7"**: 1290x2796 pixels (PNG)
   - **iOS iPad 12.9"**: 2048x2732 pixels (PNG)  
   - **Android Phone**: 1080x1920 pixels minimum (PNG/JPG)
   - **Android Tablet 7"**: 1200x1920 pixels minimum (PNG/JPG)
   - **Android Tablet 10"**: 1920x1200 pixels minimum (PNG/JPG)

### App Store Compliance Impact:
- **Apple App Store**: SVG screenshots will cause automatic rejection
- **Google Play Store**: SVG screenshots will cause automatic rejection
- **Severity**: CRITICAL - Blocks submission

### Resolution Steps:
1. ✅ SVG files temporarily moved to backup location
2. ⏳ Convert each SVG to PNG using provided HTML converter
3. ⏳ Verify PNG dimensions match platform requirements
4. ⏳ Test submission with new PNG screenshots

**Status**: PENDING - Manual conversion required using icon_converter.html