/**
 * Magic UI Components for TailTracker
 * 
 * Modern, animated UI components adapted for React Native
 * Bringing web-quality animations to mobile experiences
 */

// Button Components
export { AnimatedButton } from './AnimatedButton';

// Text Animation Components
export {
  TypingAnimation,
  AnimatedGradientText,
  TextReveal,
  ShinyText,
  BoxReveal,
  MagicTextAnimations,
} from './TextAnimations';

// Progress & Loading Components
export {
  AnimatedCircularProgressBar,
  NumberTicker,
  OrbitingCircles,
  BlurFade,
  ScrollProgress,
  MagicProgressAnimations,
} from './ProgressAnimations';

// Complete Magic UI System
export const TailTrackerMagicUI = {
  // Buttons
  AnimatedButton,
  
  // Text Animations
  TypingAnimation,
  AnimatedGradientText,
  TextReveal,
  ShinyText,
  BoxReveal,
  
  // Progress & Loading
  AnimatedCircularProgressBar,
  NumberTicker,
  OrbitingCircles,
  BlurFade,
  ScrollProgress,
} as const;

export default TailTrackerMagicUI;