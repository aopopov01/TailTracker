import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';

interface DynamicTypeTextProps extends TextProps {
  textStyle?: 'largeTitle' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'subhead' | 'footnote' | 'caption1' | 'caption2';
  children: React.ReactNode;
  maxFontSizeMultiplier?: number;
}

export const DynamicTypeText: React.FC<DynamicTypeTextProps> = ({
  textStyle = 'body',
  children,
  style,
  maxFontSizeMultiplier = 1.5,
  ...props
}) => {
  const getTextStyle = () => {
    if (Platform.OS === 'ios') {
      // iOS Dynamic Type text styles
      switch (textStyle) {
        case 'largeTitle':
          return styles.largeTitle;
        case 'title1':
          return styles.title1;
        case 'title2':
          return styles.title2;
        case 'title3':
          return styles.title3;
        case 'headline':
          return styles.headline;
        case 'body':
          return styles.body;
        case 'callout':
          return styles.callout;
        case 'subhead':
          return styles.subhead;
        case 'footnote':
          return styles.footnote;
        case 'caption1':
          return styles.caption1;
        case 'caption2':
          return styles.caption2;
        default:
          return styles.body;
      }
    } else {
      // Android scaled text styles
      return getAndroidTextStyle(textStyle);
    }
  };

  const getAndroidTextStyle = (style: string) => {
    switch (style) {
      case 'largeTitle':
        return styles.androidLargeTitle;
      case 'title1':
        return styles.androidTitle1;
      case 'title2':
        return styles.androidTitle2;
      case 'title3':
        return styles.androidTitle3;
      case 'headline':
        return styles.androidHeadline;
      case 'body':
        return styles.androidBody;
      case 'callout':
        return styles.androidCallout;
      case 'subhead':
        return styles.androidSubhead;
      case 'footnote':
        return styles.androidFootnote;
      case 'caption1':
        return styles.androidCaption1;
      case 'caption2':
        return styles.androidCaption2;
      default:
        return styles.androidBody;
    }
  };

  return (
    <Text
      style={[getTextStyle(), style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      allowFontScaling={true}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  // iOS Dynamic Type text styles (match iOS system styles)
  largeTitle: Platform.select({
    ios: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700',
    },
    default: {},
  }),
  title1: Platform.select({
    ios: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
    },
    default: {},
  }),
  title2: Platform.select({
    ios: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
    },
    default: {},
  }),
  title3: Platform.select({
    ios: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600',
    },
    default: {},
  }),
  headline: Platform.select({
    ios: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600',
    },
    default: {},
  }),
  body: Platform.select({
    ios: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400',
    },
    default: {},
  }),
  callout: Platform.select({
    ios: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '400',
    },
    default: {},
  }),
  subhead: Platform.select({
    ios: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400',
    },
    default: {},
  }),
  footnote: Platform.select({
    ios: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
    },
    default: {},
  }),
  caption1: Platform.select({
    ios: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
    },
    default: {},
  }),
  caption2: Platform.select({
    ios: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '400',
    },
    default: {},
  }),

  // Android equivalent text styles (with font scaling support)
  androidLargeTitle: Platform.select({
    android: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidTitle1: Platform.select({
    android: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidTitle2: Platform.select({
    android: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidTitle3: Platform.select({
    android: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidHeadline: Platform.select({
    android: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidBody: Platform.select({
    android: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidCallout: Platform.select({
    android: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '400',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidSubhead: Platform.select({
    android: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidFootnote: Platform.select({
    android: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidCaption1: Platform.select({
    android: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
  androidCaption2: Platform.select({
    android: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '400',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    default: {},
  }),
});

export default DynamicTypeText;