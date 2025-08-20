/**
 * TailTracker Interactive Illustrations
 * 
 * These illustrations respond to user interactions with delightful animations
 * and micro-interactions. They create emotional connections through playful
 * responses that make the app feel alive and caring.
 * 
 * INTERACTION PRINCIPLES:
 * - Respond to touch with pet-like reactions
 * - Provide visual feedback that feels natural
 * - Create moments of delight and surprise
 * - Maintain performance while being engaging
 * - Respect accessibility preferences
 */

import React, { useState, useCallback } from 'react';
import { illustrationColors, IllustrationContainer } from '../IllustrationSystem';

// ====================================
// TOUCH-RESPONSIVE ILLUSTRATIONS
// ====================================

/**
 * Interactive Pet That Responds to Touch
 * Pet reacts with joy when touched, creating emotional connection
 */
export const TouchablePet: React.FC = () => {
  const [isPressed, setIsPressed] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  
  const handleTouch = useCallback(() => {
    setIsPressed(true);
    setTouchCount(prev => prev + 1);
    
    // Reset pressed state after animation
    setTimeout(() => setIsPressed(false), 300);
  }, []);
  
  return (
    <IllustrationContainer size="large" mood="playful" animated>
      <svg 
        viewBox="0 0 300 300" 
        style={{ width: '90%', height: '90%', cursor: 'pointer' }}
        onMouseDown={handleTouch}
        onTouchStart={handleTouch}
      >
        {/* Interactive Background */}
        <circle 
          cx="150" 
          cy="150" 
          r={isPressed ? "110" : "100"} 
          fill={illustrationColors.environments.play}
          opacity={isPressed ? "0.6" : "0.3"}
          style={{ 
            transition: 'all 0.3s ease-out',
            animation: isPressed ? 'heart-beat 0.6s ease-out' : 'none'
          }}
        />
        
        {/* Responsive Pet */}
        <g 
          style={{ 
            transform: isPressed ? 'scale(1.1)' : 'scale(1)',
            transformOrigin: '150px 150px',
            transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            animation: 'gentle-float 2s ease-in-out infinite alternate'
          }}
        >
          {/* Pet Body */}
          <ellipse cx="150" cy="170" rx="30" ry="22" fill={illustrationColors.petFur.golden} />
          <circle cx="150" cy="135" r="25" fill={illustrationColors.petFur.golden} />
          
          {/* Reactive Ears */}
          <ellipse 
            cx="132" 
            cy="120" 
            rx="7" 
            ry="12" 
            fill={illustrationColors.petFur.brown} 
            transform={isPressed ? "rotate(-5 132 120)" : "rotate(-15 132 120)"}
            style={{ transition: 'transform 0.3s ease-out' }}
          />
          <ellipse 
            cx="168" 
            cy="120" 
            rx="7" 
            ry="12" 
            fill={illustrationColors.petFur.brown} 
            transform={isPressed ? "rotate(5 168 120)" : "rotate(15 168 120)"}
            style={{ transition: 'transform 0.3s ease-out' }}
          />
          
          {/* Emotional Eyes */}
          <circle cx="143" cy="130" r={isPressed ? "7" : "6"} fill={illustrationColors.eyes.warm} />
          <circle cx="157" cy="130" r={isPressed ? "7" : "6"} fill={illustrationColors.eyes.warm} />
          <circle cx="144.5" cy={isPressed ? "126" : "127"} r="2.5" fill="white" />
          <circle cx="158.5" cy={isPressed ? "126" : "127"} r="2.5" fill="white" />
          
          {/* Heart Eyes on Touch */}
          {isPressed && (
            <>
              <path d="M 143 130 C 141 127, 137 127, 139 132 C 135 127, 131 127, 133 132 C 133 137, 139 142, 139 142 C 139 142, 145 137, 145 132 Z" 
                    fill={illustrationColors.accents.heart} opacity="0.8" />
              <path d="M 157 130 C 155 127, 151 127, 153 132 C 149 127, 145 127, 147 132 C 147 137, 153 142, 153 142 C 153 142, 159 137, 159 132 Z" 
                    fill={illustrationColors.accents.heart} opacity="0.8" />
            </>
          )}
          
          {/* Reactive Expression */}
          <ellipse cx="150" cy="140" rx="3" ry="2" fill="#1F2937" />
          <path 
            d={isPressed ? "M 142 145 Q 150 155 158 145" : "M 145 145 Q 150 150 155 145"} 
            stroke="#1F2937" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round"
            style={{ transition: 'all 0.3s ease-out' }}
          />
          
          {/* Excited Tail */}
          <path 
            d="M 175 165 Q 195 155 190 135" 
            stroke={illustrationColors.petFur.golden} 
            strokeWidth="6" 
            fill="none"
            strokeLinecap="round"
            style={{
              transformOrigin: '175px 165px',
              animation: isPressed ? 'tail-wag 0.2s ease-in-out infinite' : 'tail-wag 2s ease-in-out infinite'
            }}
          />
        </g>
        
        {/* Touch Feedback Hearts */}
        {isPressed && Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 360) / 6;
          const x = 150 + 60 * Math.cos((angle * Math.PI) / 180);
          const y = 150 + 60 * Math.sin((angle * Math.PI) / 180);
          
          return (
            <path 
              key={i}
              d={`M ${x} ${y} C ${x-3} ${y-4}, ${x-8} ${y-4}, ${x-6} ${y+1} C ${x-10} ${y-4}, ${x-15} ${y-4}, ${x-13} ${y+1} C ${x-13} ${y+6}, ${x-6} ${y+10}, ${x-6} ${y+10} C ${x-6} ${y+10}, ${x+1} ${y+6}, ${x+1} ${y+1} Z`}
              fill={illustrationColors.accents.heart}
              opacity="0.8"
              style={{ 
                animation: `heart-beat 0.6s ease-out`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          );
        })}
        
        {/* Touch Counter */}
        {touchCount > 0 && (
          <text 
            x="150" 
            y="240" 
            textAnchor="middle" 
            fontSize="14" 
            fontWeight="bold" 
            fill={illustrationColors.accents.heart}
          >
            {touchCount === 1 ? "Aww! Pet me more! 🥰" : 
             touchCount < 5 ? "So happy! Keep going! 😍" : 
             "You're the best human! 💕"}
          </text>
        )}
      </svg>
    </IllustrationContainer>
  );
};

/**
 * Animated Loading Pet
 * Pet performs different animations while content loads
 */
export const AnimatedLoadingPet: React.FC<{ loadingStage?: 'fetching' | 'processing' | 'almost-done' }> = ({ 
  loadingStage = 'fetching' 
}) => {
  const getAnimation = () => {
    switch (loadingStage) {
      case 'fetching':
        return { 
          petAnimation: 'gentle-float 1s ease-in-out infinite alternate',
          tailAnimation: 'tail-wag 1.5s ease-in-out infinite',
          message: 'Fetching your pet\'s data... 🔍'
        };
      case 'processing':
        return { 
          petAnimation: 'heart-beat 0.8s ease-in-out infinite',
          tailAnimation: 'tail-wag 0.8s ease-in-out infinite',
          message: 'Processing with love... 💝'
        };
      case 'almost-done':
        return { 
          petAnimation: 'gentle-float 0.5s ease-in-out infinite alternate',
          tailAnimation: 'tail-wag 0.4s ease-in-out infinite',
          message: 'Almost ready! 🎉'
        };
      default:
        return { 
          petAnimation: 'gentle-float 2s ease-in-out infinite alternate',
          tailAnimation: 'tail-wag 2s ease-in-out infinite',
          message: 'Loading...'
        };
    }
  };
  
  const { petAnimation, tailAnimation, message } = getAnimation();
  
  return (
    <IllustrationContainer size="medium" mood="playful" animated>
      <svg viewBox="0 0 200 200" style={{ width: '90%', height: '90%' }}>
        {/* Loading Rings */}
        {Array.from({ length: 3 }).map((_, i) => (
          <circle 
            key={i}
            cx="100" 
            cy="100" 
            r={30 + i * 20} 
            fill="none"
            stroke={illustrationColors.accents.sparkle}
            strokeWidth="2"
            opacity={0.3 - i * 0.1}
            style={{ 
              animation: `twinkle ${2 + i * 0.5}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
        
        {/* Animated Pet */}
        <g style={{ animation: petAnimation }}>
          {/* Pet Body */}
          <ellipse cx="100" cy="120" rx="22" ry="16" fill={illustrationColors.petFur.golden} />
          <circle cx="100" cy="90" r="18" fill={illustrationColors.petFur.golden} />
          
          {/* Focused Ears */}
          <ellipse cx="88" cy="78" rx="5" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(-10 88 78)" />
          <ellipse cx="112" cy="78" rx="5" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(10 112 78)" />
          
          {/* Concentration Eyes */}
          <circle cx="95" cy="85" r="4" fill={illustrationColors.eyes.warm} />
          <circle cx="105" cy="85" r="4" fill={illustrationColors.eyes.warm} />
          <circle cx="96" cy="83" r="1.5" fill="white" />
          <circle cx="106" cy="83" r="1.5" fill="white" />
          
          {/* Working Expression */}
          <ellipse cx="100" cy="95" rx="2" ry="1.5" fill="#1F2937" />
          
          {/* Active Tail */}
          <path 
            d="M 118 115 Q 130 110 127 95" 
            stroke={illustrationColors.petFur.golden} 
            strokeWidth="4" 
            fill="none"
            strokeLinecap="round"
            style={{
              transformOrigin: '118px 115px',
              animation: tailAnimation
            }}
          />
        </g>
        
        {/* Loading Dots Following Pet */}
        {Array.from({ length: 5 }).map((_, i) => (
          <circle 
            key={i}
            cx={60 + i * 20} 
            cy={150} 
            r="3" 
            fill={illustrationColors.accents.star}
            style={{ 
              animation: `twinkle ${0.6}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
        
        {/* Stage Message */}
        <text 
          x="100" 
          y="180" 
          textAnchor="middle" 
          fontSize="12" 
          fontWeight="bold" 
          fill={illustrationColors.states.excited}
        >
          {message}
        </text>
      </svg>
    </IllustrationContainer>
  );
};

// ====================================
// ANIMATION CONFIGURATION
// ====================================

/**
 * Interactive Animation Styles
 * CSS animations optimized for interactive illustrations
 */
export const interactiveAnimationCSS = `
/* Enhanced Interactive Animations */
@keyframes tail-wag {
  0% { transform: rotate(-20deg); }
  25% { transform: rotate(20deg); }
  50% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
  100% { transform: rotate(-20deg); }
}

@keyframes gentle-float {
  0% { transform: translateY(0px); }
  100% { transform: translateY(-12px); }
}

@keyframes heart-beat {
  0% { transform: scale(1); }
  30% { transform: scale(1.15); }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes twinkle {
  0% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.3; transform: scale(0.8); }
}

/* Accessibility: Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .interactive-pet * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

export default {
  TouchablePet,
  AnimatedLoadingPet,
  interactiveAnimationCSS,
};