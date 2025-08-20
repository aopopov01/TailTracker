/**
 * Magic UI - Text Animations for React Native
 * Adapted from Magic UI text reveal, typing, and gradient text components
 */

import React, { useEffect } from 'react';
import { Text, TextProps, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { tailTrackerMotions } from '../../animations/motionSystem';

// ====================================
// TYPING ANIMATION COMPONENT
// ====================================

interface TypingAnimationProps extends TextProps {
  text: string;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
  cursorColor?: string;
  showCursor?: boolean;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  duration = 100,
  delay = 0,
  onComplete,
  cursorColor = '#3B82F6',
  showCursor = true,
  style,
  ...props
}) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [showingCursor, setShowingCursor] = React.useState(true);
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          if (onComplete) onComplete();
          // Hide cursor after typing is complete
          setTimeout(() => setShowingCursor(false), 500);
        }
      }, duration);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, duration, delay, onComplete]);

  useEffect(() => {
    // Cursor blinking animation
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      false
    );
  }, []);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={style} {...props}>
        {displayedText}
      </Text>
      {showCursor && showingCursor && (
        <Animated.Text style={[{ color: cursorColor, fontSize: 18 }, cursorStyle]}>
          |
        </Animated.Text>
      )}
    </View>
  );
};

// ====================================
// ANIMATED GRADIENT TEXT
// ====================================

interface AnimatedGradientTextProps extends TextProps {
  children: string;
  colors?: string[];
  speed?: number;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  children,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
  speed = 1,
  style,
  ...props
}) => {
  const gradientProgress = useSharedValue(0);

  useEffect(() => {
    gradientProgress.value = withRepeat(
      withTiming(1, { duration: 3000 / speed }),
      -1,
      false
    );
  }, [speed]);

  const animatedTextStyle = useAnimatedStyle(() => {
    // Simulate gradient by changing color over time
    const colorIndex = Math.floor(
      interpolate(gradientProgress.value, [0, 1], [0, colors.length - 1])
    );
    return {
      color: colors[colorIndex % colors.length],
    };
  });

  return (
    <Animated.Text style={[style, animatedTextStyle]} {...props}>
      {children}
    </Animated.Text>
  );
};

// ====================================
// TEXT REVEAL ANIMATION
// ====================================

interface TextRevealProps extends TextProps {
  children: string;
  delay?: number;
  staggerDelay?: number;
  animationType?: 'fadeIn' | 'slideUp' | 'scaleIn';
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  delay = 0,
  staggerDelay = 50,
  animationType = 'fadeIn',
  style,
  ...props
}) => {
  const words = children.split(' ');

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {words.map((word, index) => (
        <AnimatedWord
          key={`${word}-${index}`}
          word={word}
          delay={delay + index * staggerDelay}
          animationType={animationType}
          isLast={index === words.length - 1}
          style={style}
          {...props}
        />
      ))}
    </View>
  );
};

interface AnimatedWordProps extends TextProps {
  word: string;
  delay: number;
  animationType: 'fadeIn' | 'slideUp' | 'scaleIn';
  isLast: boolean;
}

const AnimatedWord: React.FC<AnimatedWordProps> = ({
  word,
  delay,
  animationType,
  isLast,
  style,
  ...props
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const startAnimation = () => {
      switch (animationType) {
        case 'fadeIn':
          opacity.value = withTiming(1, { duration: 600 });
          break;
        case 'slideUp':
          opacity.value = withTiming(1, { duration: 600 });
          translateY.value = withTiming(0, { duration: 600 });
          break;
        case 'scaleIn':
          opacity.value = withTiming(1, { duration: 600 });
          scale.value = withTiming(1, { duration: 600 });
          break;
      }
    };

    const timeout = setTimeout(startAnimation, delay);
    return () => clearTimeout(timeout);
  }, [delay, animationType]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.Text style={[style, animatedStyle]} {...props}>
      {word}{!isLast ? ' ' : ''}
    </Animated.Text>
  );
};

// ====================================
// SHINY TEXT ANIMATION
// ====================================

interface ShinyTextProps extends TextProps {
  children: string;
  shimmerWidth?: number;
  shimmerColor?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  children,
  shimmerWidth = 100,
  shimmerColor = 'rgba(255, 255, 255, 0.6)',
  style,
  ...props
}) => {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-shimmerWidth, shimmerWidth]
    );

    return {
      transform: [{ translateX }],
      opacity: interpolate(
        shimmerProgress.value,
        [0, 0.5, 1],
        [0, 1, 0]
      ),
    };
  });

  return (
    <View style={{ overflow: 'hidden' }}>
      <Text style={style} {...props}>
        {children}
      </Text>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: shimmerColor,
            width: shimmerWidth,
          },
          shimmerStyle,
        ]}
      />
    </View>
  );
};

// ====================================
// BOX REVEAL ANIMATION
// ====================================

interface BoxRevealProps {
  children: React.ReactNode;
  width?: number | '100%';
  boxColor?: string;
  duration?: number;
  delay?: number;
}

export const BoxReveal: React.FC<BoxRevealProps> = ({
  children,
  width = '100%',
  boxColor = '#3B82F6',
  duration = 500,
  delay = 250,
}) => {
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(75);
  const boxPosition = useSharedValue(0);

  useEffect(() => {
    // First show the content
    const contentTimeout = setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration });
      contentTranslateY.value = withTiming(0, { duration });
    }, delay);

    // Then slide the box away
    const boxTimeout = setTimeout(() => {
      boxPosition.value = withTiming(1, { duration });
    }, 0);

    return () => {
      clearTimeout(contentTimeout);
      clearTimeout(boxTimeout);
    };
  }, [duration, delay]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const boxStyle = useAnimatedStyle(() => {
    const translateX = interpolate(boxPosition.value, [0, 1], [0, typeof width === 'number' ? width : 300]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={{
        position: 'relative',
        width: typeof width === 'number' ? width : '100%',
        overflow: 'hidden',
      }}
    >
      <Animated.View style={contentStyle}>
        {children}
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 0,
            right: 0,
            backgroundColor: boxColor,
            zIndex: 20,
          },
          boxStyle,
        ]}
      />
    </View>
  );
};

// ====================================
// EXPORTS
// ====================================

export const MagicTextAnimations = {
  TypingAnimation,
  AnimatedGradientText,
  TextReveal,
  ShinyText,
  BoxReveal,
};

export default MagicTextAnimations;