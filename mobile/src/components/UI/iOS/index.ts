// iOS-specific UI Components
// Following Apple's Human Interface Guidelines

export { iOSButton, iOSButtonType, iOSButtonSize } from './iOSButton';
export { iOSCard } from './iOSCard';
export { iOSTextInput } from './iOSTextInput';
export { iOSActionSheet, type ActionSheetAction } from './iOSActionSheet';
export { iOSTabBar, type TabItem } from './iOSTabBar';

// Component guidelines and best practices:
//
// 1. iOSButton:
//    - Use Primary for main actions
//    - Use Secondary for alternative actions
//    - Use Destructive for delete/remove actions
//    - Haptic feedback is enabled by default
//
// 2. iOSCard:
//    - Supports blur effects on iOS
//    - Automatic dark/light theme support
//    - Elevation shadows follow iOS standards
//
// 3. iOSTextInput:
//    - Animated focus states
//    - Supports icons and validation
//    - Keyboard appearance adapts to theme
//
// 4. iOSActionSheet:
//    - Native iOS-style action sheets
//    - Blur background effect
//    - Haptic feedback on selections
//
// 5. iOSTabBar:
//    - Standard iOS tab bar dimensions
//    - Blur effect support
//    - Badge notifications
//    - Safe area handling

// Theme Integration:
// All components automatically adapt to iOS dark/light mode
// Colors follow iOS system color palette
// Typography uses San Francisco font weights