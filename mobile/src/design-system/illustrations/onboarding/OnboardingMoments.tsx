/**
 * TailTracker Onboarding Moments - Part 2
 * 
 * Additional onboarding illustrations focusing on intimate moments like
 * naming your pet and taking their first photo. These create deep emotional
 * connections by celebrating the special bond between pets and their families.
 */

import React from 'react';
import { illustrationColors, IllustrationContainer } from '../IllustrationSystem';

// ====================================
// PET NAMING CEREMONY
// ====================================

/**
 * Pet Naming Moment
 * A magical moment when the pet gets their name - shows floating letters
 * and a pet looking excited about their new identity
 */
export const PetNamingCeremony: React.FC<{ petName?: string }> = ({ petName = "MAX" }) => (
  <IllustrationContainer size="large" mood="playful" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Magical Naming Background */}
      <defs>
        <radialGradient id="naming-glow" cx="50%" cy="30%">
          <stop offset="0%" stopColor={illustrationColors.accents.sparkle} stopOpacity="0.3" />
          <stop offset="100%" stopColor={illustrationColors.environments.play} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <ellipse cx="150" cy="100" rx="120" ry="60" fill="url(#naming-glow)" />
      
      {/* Happy Pet (Dog) receiving their name */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        {/* Body */}
        <ellipse cx="150" cy="200" rx="35" ry="25" fill={illustrationColors.petFur.golden} />
        
        {/* Head */}
        <circle cx="150" cy="160" r="28" fill={illustrationColors.petFur.golden} />
        
        {/* Ears */}
        <ellipse cx="135" cy="145" rx="8" ry="15" fill={illustrationColors.petFur.brown} transform="rotate(-20 135 145)" />
        <ellipse cx="165" cy="145" rx="8" ry="15" fill={illustrationColors.petFur.brown} transform="rotate(20 165 145)" />
        
        {/* Eyes - Sparkling with Joy */}
        <circle cx="143" cy="155" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="155" r="6" fill={illustrationColors.eyes.warm} />
        
        {/* Eye Shine - Extra bright for excitement */}
        <circle cx="145" cy="152" r="2.5" fill="white" />
        <circle cx="159" cy="152" r="2.5" fill="white" />
        
        {/* Star-shaped pupils for magic moment */}
        <path d="M 143 155 L 144 153 L 145.5 153.5 L 144 154.5 L 145 156 L 143 155.5 L 141 156 L 142 154.5 L 140.5 153.5 L 142 153 Z" fill="white" />
        <path d="M 157 155 L 158 153 L 159.5 153.5 L 158 154.5 L 159 156 L 157 155.5 L 155 156 L 156 154.5 L 154.5 153.5 L 156 153 Z" fill="white" />
        
        {/* Nose */}
        <ellipse cx="150" cy="163" rx="3" ry="2" fill="#1F2937" />
        
        {/* Happy Open Mouth */}
        <ellipse cx="150" cy="168" rx="4" ry="6" fill="#1F2937" />
        <ellipse cx="150" cy="170" rx="2" ry="3" fill="#F87171" />
        
        {/* Tail - Wagging with extreme happiness */}
        <path 
          d="M 180 195 Q 200 185 195 165" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
          style={{
            transformOrigin: '180px 195px',
            animation: 'tail-wag 0.4s ease-in-out infinite'
          }}
        />
      </g>
      
      {/* Floating Name Letters */}
      {petName.split('').map((letter, i) => (
        <g 
          key={i}
          style={{ 
            animation: `gentle-float ${2 + i * 0.2}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`
          }}
        >
          <circle 
            cx={100 + i * 25} 
            cy={80 - i * 5} 
            r="18" 
            fill={illustrationColors.accents.star}
            stroke={illustrationColors.petFur.golden}
            strokeWidth="2"
          />
          <text 
            x={100 + i * 25} 
            y={85 - i * 5} 
            textAnchor="middle" 
            fontSize="16" 
            fontWeight="bold" 
            fill="white"
          >
            {letter}
          </text>
        </g>
      ))}
      
      {/* Magic Sparkles Around Name */}
      {Array.from({ length: 10 }).map((_, i) => (
        <circle 
          key={i}
          cx={80 + i * 15 + Math.cos(i) * 20} 
          cy={60 + Math.sin(i) * 15} 
          r={1 + Math.sin(i) * 1} 
          fill={illustrationColors.accents.sparkle}
          style={{ 
            animation: `twinkle ${1 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      
      {/* Heart Shower for Love */}
      {Array.from({ length: 6 }).map((_, i) => (
        <path 
          key={i}
          d={`M ${50 + i * 35} ${240 + i * 5} C ${48 + i * 35} 237, ${42 + i * 35} 237, ${44 + i * 35} 242 C ${39 + i * 35} 237, ${33 + i * 35} 237, ${35 + i * 35} 242 C ${35 + i * 35} 247, ${44 + i * 35} 252, ${44 + i * 35} 252 C ${44 + i * 35} 252, ${53 + i * 35} 247, ${53 + i * 35} 242 Z`}
          fill={illustrationColors.accents.heart}
          opacity={0.6 + i * 0.1}
          style={{ 
            animation: `heart-beat ${1.5 + i * 0.2}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
      
      {/* Naming Text */}
      <text 
        x="150" 
        y="280" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.petFur.golden}
      >
        A special name for a special friend! ✨
      </text>
    </svg>
  </IllustrationContainer>
);

// ====================================
// FIRST PHOTO MOMENT
// ====================================

/**
 * First Photo Capture
 * Shows a pet posing adorably for their first profile photo
 */
export const FirstPhotoMoment: React.FC<{ petType?: 'dog' | 'cat' }> = ({ petType = 'dog' }) => (
  <IllustrationContainer size="large" mood="happy" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Photo Frame */}
      <rect 
        x="50" 
        y="80" 
        width="200" 
        height="150" 
        rx="15" 
        fill="white"
        stroke={illustrationColors.petFur.golden}
        strokeWidth="4"
        style={{ 
          boxShadow: illustrationColors.states.premium,
          animation: 'gentle-float 3s ease-in-out infinite alternate'
        }}
      />
      
      {/* Camera Flash Effect */}
      <defs>
        <radialGradient id="flash-effect" cx="50%" cy="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="70%" stopColor={illustrationColors.accents.star} stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      <circle 
        cx="150" 
        cy="155" 
        r="90" 
        fill="url(#flash-effect)"
        style={{ 
          animation: 'twinkle 4s ease-in-out infinite'
        }}
      />
      
      {/* Pet Posing for Photo */}
      {petType === 'dog' ? (
        <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
          {/* Dog sitting perfectly for photo */}
          <ellipse cx="150" cy="180" rx="30" ry="25" fill={illustrationColors.petFur.golden} />
          <circle cx="150" cy="140" r="25" fill={illustrationColors.petFur.golden} />
          
          {/* Perfect Ears */}
          <ellipse cx="135" cy="125" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(-15 135 125)" />
          <ellipse cx="165" cy="125" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(15 165 125)" />
          
          {/* Camera-Ready Eyes */}
          <circle cx="143" cy="135" r="5" fill={illustrationColors.eyes.warm} />
          <circle cx="157" cy="135" r="5" fill={illustrationColors.eyes.warm} />
          <circle cx="144.5" cy="133" r="2" fill="white" />
          <circle cx="158.5" cy="133" r="2" fill="white" />
          
          {/* Perfect Smile */}
          <path d="M 142 145 Q 150 150 158 145" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="150" cy="147" rx="2" ry="1" fill="#F87171" />
          
          {/* Perfectly Still Tail */}
          <path 
            d="M 180 175 Q 195 165 190 145" 
            stroke={illustrationColors.petFur.golden} 
            strokeWidth="5" 
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g style={{ animation: 'gentle-float 2.5s ease-in-out infinite alternate' }}>
          {/* Cat in elegant pose */}
          <ellipse cx="150" cy="180" rx="28" ry="20" fill={illustrationColors.petFur.gray} />
          <circle cx="150" cy="145" r="22" fill={illustrationColors.petFur.gray} />
          
          {/* Elegant Ears */}
          <polygon points="135,130 140,115 150,130" fill={illustrationColors.petFur.gray} />
          <polygon points="150,130 160,115 165,130" fill={illustrationColors.petFur.gray} />
          
          {/* Mysterious Eyes */}
          <ellipse cx="143" cy="140" rx="4" ry="6" fill={illustrationColors.eyes.gentle} />
          <ellipse cx="157" cy="140" rx="4" ry="6" fill={illustrationColors.eyes.gentle} />
          <ellipse cx="143" cy="138" rx="1.5" ry="2" fill="white" />
          <ellipse cx="157" cy="138" rx="1.5" ry="2" fill="white" />
          
          {/* Sophisticated Expression */}
          <polygon points="150,148 147,151 153,151" fill={illustrationColors.accents.flower} />
          
          {/* Graceful Tail */}
          <path 
            d="M 175 180 Q 195 170 190 150 Q 185 140 180 145" 
            stroke={illustrationColors.petFur.gray} 
            strokeWidth="4" 
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}
      
      {/* Camera Icon */}
      <g style={{ animation: 'heart-beat 2s ease-in-out infinite' }}>
        <rect x="140" y="40" width="20" height="15" rx="3" fill={illustrationColors.petFur.brown} />
        <circle cx="150" cy="47" r="6" fill="#1F2937" />
        <circle cx="150" cy="47" r="3" fill={illustrationColors.accents.sparkle} />
        <rect x="145" y="35" width="10" height="5" rx="2" fill={illustrationColors.petFur.brown} />
      </g>
      
      {/* Photo Corner Decorations */}
      <circle cx="65" cy="95" r="3" fill={illustrationColors.accents.heart} />
      <circle cx="235" cy="95" r="3" fill={illustrationColors.accents.heart} />
      <circle cx="65" cy="215" r="3" fill={illustrationColors.accents.heart} />
      <circle cx="235" cy="215" r="3" fill={illustrationColors.accents.heart} />
      
      {/* Sparkle Effects */}
      {Array.from({ length: 8 }).map((_, i) => (
        <circle 
          key={i}
          cx={70 + i * 20} 
          cy={250 + Math.sin(i) * 10} 
          r={1 + Math.cos(i) * 0.5} 
          fill={illustrationColors.accents.sparkle}
          style={{ 
            animation: `twinkle ${1.5 + i * 0.2}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
      
      {/* Perfect Photo Text */}
      <text 
        x="150" 
        y="270" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.petFur.golden}
      >
        Perfect! Your pet is photogenic! 📸
      </text>
    </svg>
  </IllustrationContainer>
);

// ====================================
// FIRST WALK SETUP
// ====================================

/**
 * First Walk Setup
 * Shows excitement about setting up first walk tracking
 */
export const FirstWalkSetup: React.FC = () => (
  <IllustrationContainer size="large" mood="playful" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Walking Path */}
      <path 
        d="M 30 200 Q 80 180 130 200 Q 180 220 230 200 Q 280 180 320 200" 
        stroke={illustrationColors.environments.park} 
        strokeWidth="8" 
        fill="none"
        strokeLinecap="round"
        strokeDasharray="10,5"
        style={{ 
          animation: 'gentle-float 3s ease-in-out infinite alternate'
        }}
      />
      
      {/* Dog Walking with Excitement */}
      <g style={{ 
        animation: 'gentle-float 1.5s ease-in-out infinite alternate',
        transformOrigin: '150px 170px'
      }}>
        {/* Dog Body */}
        <ellipse cx="150" cy="170" rx="25" ry="18" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="140" r="20" fill={illustrationColors.petFur.golden} />
        
        {/* Ears Flapping */}
        <ellipse cx="138" cy="128" rx="6" ry="10" fill={illustrationColors.petFur.brown} 
                 transform="rotate(-25 138 128)"
                 style={{ animation: 'tail-wag 1s ease-in-out infinite' }} />
        <ellipse cx="162" cy="128" rx="6" ry="10" fill={illustrationColors.petFur.brown}
                 transform="rotate(25 162 128)"
                 style={{ animation: 'tail-wag 1s ease-in-out infinite', animationDelay: '0.2s' }} />
        
        {/* Excited Eyes */}
        <circle cx="145" cy="135" r="4" fill={illustrationColors.eyes.warm} />
        <circle cx="155" cy="135" r="4" fill={illustrationColors.eyes.warm} />
        <circle cx="146" cy="133" r="1.5" fill="white" />
        <circle cx="156" cy="133" r="1.5" fill="white" />
        
        {/* Panting Mouth */}
        <ellipse cx="150" cy="145" rx="3" ry="4" fill="#1F2937" />
        <ellipse cx="150" cy="147" rx="2" ry="2" fill="#F87171" />
        
        {/* Enthusiastic Tail */}
        <path 
          d="M 173 165 Q 185 155 180 140" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="4" 
          fill="none"
          strokeLinecap="round"
          style={{
            transformOrigin: '173px 165px',
            animation: 'tail-wag 0.6s ease-in-out infinite'
          }}
        />
        
        {/* Walking Legs */}
        <ellipse cx="142" cy="185" rx="3" ry="8" fill={illustrationColors.petFur.golden} />
        <ellipse cx="158" cy="185" rx="3" ry="8" fill={illustrationColors.petFur.golden} />
      </g>
      
      {/* Leash */}
      <path 
        d="M 150 120 Q 100 80 80 60" 
        stroke={illustrationColors.petFur.brown} 
        strokeWidth="2" 
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Human Hand Holding Leash */}
      <circle cx="80" cy="60" r="12" fill={illustrationColors.environments.home} />
      <ellipse cx="80" cy="45" rx="6" ry="15" fill={illustrationColors.environments.home} />
      
      {/* Step Counter */}
      <g style={{ animation: 'heart-beat 2s ease-in-out infinite' }}>
        <rect x="200" y="80" width="50" height="30" rx="8" fill={illustrationColors.accents.star} />
        <text x="225" y="95" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">STEPS</text>
        <text x="225" y="105" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">0</text>
      </g>
      
      {/* Paw Prints on Path */}
      {Array.from({ length: 5 }).map((_, i) => (
        <g key={i} style={{ 
          animation: `twinkle ${2 + i * 0.3}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.5}s`
        }}>
          <circle cx={50 + i * 40} cy={200 + (i % 2) * 10} r="3" fill={illustrationColors.petFur.brown} />
          <circle cx={52 + i * 40} cy={195 + (i % 2) * 10} r="1.5" fill={illustrationColors.petFur.brown} />
          <circle cx={48 + i * 40} cy={195 + (i % 2) * 10} r="1.5" fill={illustrationColors.petFur.brown} />
          <circle cx={50 + i * 40} cy={192 + (i % 2) * 10} r="1" fill={illustrationColors.petFur.brown} />
        </g>
      ))}
      
      {/* Adventure Text */}
      <text 
        x="150" 
        y="250" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="bold" 
        fill={illustrationColors.states.excited}
      >
        Adventure awaits! 🚶‍♂️🐕
      </text>
      
      <text 
        x="150" 
        y="270" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Let's track those happy steps together
      </text>
    </svg>
  </IllustrationContainer>
);

export default {
  PetNamingCeremony,
  FirstPhotoMoment,
  FirstWalkSetup,
};