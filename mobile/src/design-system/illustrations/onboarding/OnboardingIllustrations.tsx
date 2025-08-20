/**
 * TailTracker Onboarding Illustrations
 * 
 * These illustrations create the crucial first impression and emotional connection.
 * Every illustration is designed to make users think: "This app understands how much
 * I love my pet and wants to help me care for them better."
 * 
 * EMOTIONAL GOALS:
 * - Instant warmth and welcome feeling
 * - Excitement about the pet care journey
 * - Trust in the app's expertise and care
 * - Joy in sharing their pet's story
 */

import React from 'react';
import { illustrationColors, IllustrationContainer, PetEyes, HeartFloat, SparkleEffect } from '../IllustrationSystem';

// ====================================
// PET SELECTION ILLUSTRATIONS
// ====================================

/**
 * Happy Dog Selection - Golden Retriever Style
 * Warm, friendly dog that represents loyalty and joy
 */
export const HappyDogSelection: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => (
  <IllustrationContainer size={size} mood="happy" animated>
    <svg viewBox="0 0 200 200" style={{ width: '80%', height: '80%' }}>
      {/* Dog Body */}
      <ellipse 
        cx="100" 
        cy="120" 
        rx="45" 
        ry="35" 
        fill={illustrationColors.petFur.golden}
        stroke="none"
      />
      
      {/* Dog Head */}
      <circle 
        cx="100" 
        cy="80" 
        r="35" 
        fill={illustrationColors.petFur.golden}
        stroke="none"
      />
      
      {/* Ears */}
      <ellipse 
        cx="85" 
        cy="65" 
        rx="12" 
        ry="20" 
        fill={illustrationColors.petFur.brown}
        transform="rotate(-25 85 65)"
      />
      <ellipse 
        cx="115" 
        cy="65" 
        rx="12" 
        ry="20" 
        fill={illustrationColors.petFur.brown}
        transform="rotate(25 115 65)"
      />
      
      {/* Eyes - Large and Loving */}
      <circle cx="92" cy="75" r="8" fill={illustrationColors.eyes.warm} />
      <circle cx="108" cy="75" r="8" fill={illustrationColors.eyes.warm} />
      
      {/* Eye Shine */}
      <circle cx="94" cy="72" r="3" fill="rgba(255,255,255,0.8)" />
      <circle cx="110" cy="72" r="3" fill="rgba(255,255,255,0.8)" />
      
      {/* Nose */}
      <ellipse cx="100" cy="85" rx="4" ry="3" fill="#1F2937" />
      
      {/* Mouth - Happy Smile */}
      <path 
        d="M 95 90 Q 100 95 105 90" 
        stroke="#1F2937" 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Tongue - Playful Detail */}
      <ellipse 
        cx="100" 
        cy="93" 
        rx="3" 
        ry="2" 
        fill="#F87171"
      />
      
      {/* Tail - Wagging with Animation */}
      <path 
        d="M 140 115 Q 160 105 155 85" 
        stroke={illustrationColors.petFur.golden} 
        strokeWidth="8" 
        fill="none"
        strokeLinecap="round"
        style={{
          transformOrigin: '140px 115px',
          animation: 'tail-wag 0.8s ease-in-out infinite'
        }}
      />
      
      {/* Floating Hearts */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        <path 
          d="M 60 40 C 58 35, 48 35, 50 42 C 45 35, 35 35, 37 42 C 37 48, 50 55, 50 55 C 50 55, 63 48, 63 42 Z" 
          fill={illustrationColors.accents.heart}
          opacity="0.8"
        />
        <path 
          d="M 150 50 C 148 47, 142 47, 143 51 C 140 47, 134 47, 135 51 C 135 54, 143 58, 143 58 C 143 58, 151 54, 151 51 Z" 
          fill={illustrationColors.accents.heart}
          opacity="0.6"
        />
      </g>
    </svg>
  </IllustrationContainer>
);

/**
 * Gentle Cat Selection - Soft and Elegant
 * Represents grace, independence, and loving companionship
 */
export const GentleCatSelection: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => (
  <IllustrationContainer size={size} mood="calm" animated>
    <svg viewBox="0 0 200 200" style={{ width: '80%', height: '80%' }}>
      {/* Cat Body */}
      <ellipse 
        cx="100" 
        cy="125" 
        rx="40" 
        ry="30" 
        fill={illustrationColors.petFur.gray}
      />
      
      {/* Cat Head */}
      <circle 
        cx="100" 
        cy="85" 
        r="32" 
        fill={illustrationColors.petFur.gray}
      />
      
      {/* Ears */}
      <polygon 
        points="80,65 85,45 95,65" 
        fill={illustrationColors.petFur.gray}
      />
      <polygon 
        points="105,65 115,45 120,65" 
        fill={illustrationColors.petFur.gray}
      />
      
      {/* Inner Ears */}
      <polygon 
        points="82,60 86,50 92,60" 
        fill={illustrationColors.accents.flower}
      />
      <polygon 
        points="108,60 114,50 118,60" 
        fill={illustrationColors.accents.flower}
      />
      
      {/* Eyes - Mysterious and Loving */}
      <ellipse cx="92" cy="80" rx="6" ry="8" fill={illustrationColors.eyes.gentle} />
      <ellipse cx="108" cy="80" rx="6" ry="8" fill={illustrationColors.eyes.gentle} />
      
      {/* Eye Shine */}
      <ellipse cx="93" cy="77" rx="2" ry="3" fill="rgba(255,255,255,0.9)" />
      <ellipse cx="109" cy="77" rx="2" ry="3" fill="rgba(255,255,255,0.9)" />
      
      {/* Nose */}
      <polygon 
        points="100,88 97,92 103,92" 
        fill={illustrationColors.accents.flower}
      />
      
      {/* Mouth */}
      <path 
        d="M 97 93 Q 100 96 103 93" 
        stroke="#374151" 
        strokeWidth="1.5" 
        fill="none"
      />
      
      {/* Whiskers */}
      <line x1="70" y1="85" x2="85" y2="83" stroke="#374151" strokeWidth="1" />
      <line x1="70" y1="90" x2="85" y2="90" stroke="#374151" strokeWidth="1" />
      <line x1="115" y1="83" x2="130" y2="85" stroke="#374151" strokeWidth="1" />
      <line x1="115" y1="90" x2="130" y2="90" stroke="#374151" strokeWidth="1" />
      
      {/* Tail - Elegant Curve */}
      <path 
        d="M 140 130 Q 165 120 160 90 Q 155 75 150 80" 
        stroke={illustrationColors.petFur.gray} 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        style={{
          animation: 'gentle-float 3s ease-in-out infinite alternate'
        }}
      />
      
      {/* Sparkles for Magic */}
      <g style={{ animation: 'twinkle 2s ease-in-out infinite alternate' }}>
        <circle cx="65" cy="60" r="2" fill={illustrationColors.accents.sparkle} />
        <circle cx="145" cy="70" r="1.5" fill={illustrationColors.accents.sparkle} />
        <circle cx="75" cy="140" r="1" fill={illustrationColors.accents.sparkle} />
      </g>
    </svg>
  </IllustrationContainer>
);

// ====================================
// WELCOME MOMENT ILLUSTRATIONS
// ====================================

/**
 * Welcome Home Illustration
 * Shows a pet arriving home with excitement and joy
 */
export const WelcomeHome: React.FC<{ petType?: 'dog' | 'cat' }> = ({ petType = 'dog' }) => (
  <IllustrationContainer size="large" mood="happy" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Home Background */}
      <rect 
        x="50" 
        y="100" 
        width="200" 
        height="120" 
        rx="15" 
        fill={illustrationColors.environments.home}
        stroke={illustrationColors.petFur.golden}
        strokeWidth="2"
      />
      
      {/* Door */}
      <rect 
        x="135" 
        y="140" 
        width="30" 
        height="80" 
        rx="5" 
        fill={illustrationColors.accents.heart}
      />
      
      {/* Door Handle */}
      <circle cx="160" cy="180" r="2" fill={illustrationColors.petFur.golden} />
      
      {/* Roof */}
      <polygon 
        points="40,100 150,40 260,100" 
        fill={illustrationColors.petFur.brown}
      />
      
      {/* Welcome Pet */}
      {petType === 'dog' ? (
        <g style={{ animation: 'gentle-float 1s ease-in-out infinite alternate' }}>
          {/* Dog jumping with joy */}
          <ellipse cx="150" cy="250" rx="25" ry="20" fill={illustrationColors.petFur.golden} />
          <circle cx="150" cy="220" r="20" fill={illustrationColors.petFur.golden} />
          
          {/* Happy Eyes */}
          <circle cx="145" cy="215" r="4" fill={illustrationColors.eyes.warm} />
          <circle cx="155" cy="215" r="4" fill={illustrationColors.eyes.warm} />
          <circle cx="146" cy="213" r="1.5" fill="white" />
          <circle cx="156" cy="213" r="1.5" fill="white" />
          
          {/* Excited Mouth */}
          <path d="M 145 225 Q 150 230 155 225" stroke="#1F2937" strokeWidth="2" fill="none" />
          <ellipse cx="150" cy="227" rx="2" ry="1.5" fill="#F87171" />
          
          {/* Wagging Tail */}
          <path 
            d="M 175 245 Q 190 235 185 220" 
            stroke={illustrationColors.petFur.golden} 
            strokeWidth="5" 
            fill="none"
            style={{ animation: 'tail-wag 0.5s ease-in-out infinite' }}
          />
        </g>
      ) : (
        <g style={{ animation: 'gentle-float 1.5s ease-in-out infinite alternate' }}>
          {/* Cat stretching contentedly */}
          <ellipse cx="150" cy="250" rx="30" ry="18" fill={illustrationColors.petFur.gray} />
          <ellipse cx="150" cy="220" rx="18" ry="15" fill={illustrationColors.petFur.gray} />
          
          {/* Content Eyes */}
          <ellipse cx="145" cy="218" rx="3" ry="4" fill={illustrationColors.eyes.gentle} />
          <ellipse cx="155" cy="218" rx="3" ry="4" fill={illustrationColors.eyes.gentle} />
          
          {/* Curved Tail */}
          <path 
            d="M 180 250 Q 200 240 195 220 Q 190 210 185 215" 
            stroke={illustrationColors.petFur.gray} 
            strokeWidth="4" 
            fill="none"
          />
        </g>
      )}
      
      {/* Welcome Hearts Floating */}
      <g style={{ animation: 'heart-beat 2s ease-in-out infinite' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <path 
            key={i}
            d={`M ${80 + i * 30} ${60 + i * 10} C ${78 + i * 30} 57, ${72 + i * 30} 57, ${74 + i * 30} 62 C ${69 + i * 30} 57, ${63 + i * 30} 57, ${65 + i * 30} 62 C ${65 + i * 30} 67, ${74 + i * 30} 72, ${74 + i * 30} 72 C ${74 + i * 30} 72, ${83 + i * 30} 67, ${83 + i * 30} 62 Z`}
            fill={illustrationColors.accents.heart}
            opacity={0.7 - i * 0.1}
            style={{ 
              animation: `gentle-float ${2 + i * 0.3}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </g>
      
      {/* Welcome Text Path */}
      <path 
        id="welcome-path" 
        d="M 50 30 Q 150 10 250 30" 
        fill="none" 
        stroke="none"
      />
      <text 
        fontSize="18" 
        fill={illustrationColors.petFur.golden} 
        fontWeight="bold"
        textAnchor="middle"
      >
        <textPath href="#welcome-path" startOffset="50%">
          Welcome Home! 🏠
        </textPath>
      </text>
    </svg>
  </IllustrationContainer>
);

// ====================================
// SUCCESS CELEBRATION ILLUSTRATIONS
// ====================================

/**
 * Profile Complete Celebration
 * Celebrates the completion of pet profile setup
 */
export const ProfileCompleteCelebration: React.FC = () => (
  <IllustrationContainer size="large" mood="premium" animated>
    <svg viewBox="0 0 300 300" style={{ width: '95%', height: '95%' }}>
      {/* Celebration Background Burst */}
      <defs>
        <radialGradient id="celebration-bg" cx="50%" cy="50%">
          <stop offset="0%" stopColor={illustrationColors.accents.star} stopOpacity="0.3" />
          <stop offset="100%" stopColor={illustrationColors.environments.home} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <circle cx="150" cy="150" r="140" fill="url(#celebration-bg)" />
      
      {/* Central Achievement Badge */}
      <circle 
        cx="150" 
        cy="150" 
        r="50" 
        fill={illustrationColors.accents.star}
        stroke={illustrationColors.petFur.golden}
        strokeWidth="4"
        style={{ animation: 'heart-beat 1.5s ease-in-out infinite' }}
      />
      
      {/* Check Mark */}
      <path 
        d="M 130 150 L 145 165 L 175 135" 
        stroke="white" 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Confetti Particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 360) / 12;
        const x = 150 + 80 * Math.cos((angle * Math.PI) / 180);
        const y = 150 + 80 * Math.sin((angle * Math.PI) / 180);
        const colors = [
          illustrationColors.accents.heart,
          illustrationColors.accents.star,
          illustrationColors.accents.sparkle,
          illustrationColors.states.happy,
        ];
        
        return (
          <g 
            key={i} 
            style={{ 
              animation: `twinkle ${1 + (i % 3) * 0.5}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.1}s`
            }}
          >
            <rect 
              x={x - 3} 
              y={y - 3} 
              width="6" 
              height="6" 
              fill={colors[i % colors.length]}
              transform={`rotate(${i * 30} ${x} ${y})`}
            />
          </g>
        );
      })}
      
      {/* Celebration Stars */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        const x = 150 + 110 * Math.cos((angle * Math.PI) / 180);
        const y = 150 + 110 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <g 
            key={i}
            style={{ 
              animation: `gentle-float ${2 + (i % 2)}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.2}s`
            }}
          >
            <path 
              d={`M ${x} ${y-8} L ${x+3} ${y-3} L ${x+8} ${y-3} L ${x+4} ${y+1} L ${x+6} ${y+6} L ${x} ${y+3} L ${x-6} ${y+6} L ${x-4} ${y+1} L ${x-8} ${y-3} L ${x-3} ${y-3} Z`}
              fill={illustrationColors.accents.star}
              opacity="0.8"
            />
          </g>
        );
      })}
      
      {/* Success Message */}
      <text 
        x="150" 
        y="230" 
        textAnchor="middle" 
        fontSize="20" 
        fontWeight="bold" 
        fill={illustrationColors.petFur.golden}
      >
        Profile Complete! 🎉
      </text>
      
      <text 
        x="150" 
        y="250" 
        textAnchor="middle" 
        fontSize="14" 
        fill={illustrationColors.petFur.brown}
      >
        Your pet's journey begins now
      </text>
    </svg>
  </IllustrationContainer>
);