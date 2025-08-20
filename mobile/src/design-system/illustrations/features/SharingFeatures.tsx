/**
 * TailTracker Sharing & Social Features Illustrations
 * 
 * These illustrations focus on the joy of sharing pet moments and connecting
 * with other pet parents. They emphasize community, memories, and the pride
 * pet owners feel in sharing their pets' adventures.
 */

import React from 'react';
import { illustrationColors, IllustrationContainer } from '../IllustrationSystem';

// ====================================
// PHOTO SHARING ILLUSTRATIONS
// ====================================

/**
 * Photo Sharing Moment
 * Shows the joy of capturing and sharing pet memories
 */
export const PhotoSharingJoy: React.FC = () => (
  <IllustrationContainer size="large" mood="playful" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Camera Flash Background */}
      <defs>
        <radialGradient id="camera-flash" cx="50%" cy="40%">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="30%" stopColor={illustrationColors.accents.star} stopOpacity="0.4" />
          <stop offset="100%" stopColor={illustrationColors.environments.play} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <ellipse cx="150" cy="120" rx="120" ry="80" fill="url(#camera-flash)" />
      
      {/* Adorable Pet Posing */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        {/* Pet Body - Perfect Pose */}
        <ellipse cx="150" cy="160" rx="28" ry="20" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="125" r="22" fill={illustrationColors.petFur.golden} />
        
        {/* Perfectly Positioned Ears */}
        <ellipse cx="135" cy="110" rx="6" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(-10 135 110)" />
        <ellipse cx="165" cy="110" rx="6" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(10 165 110)" />
        
        {/* Camera-Ready Eyes */}
        <circle cx="143" cy="120" r="5" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="120" r="5" fill={illustrationColors.eyes.warm} />
        <circle cx="144.5" cy="118" r="2" fill="white" />
        <circle cx="158.5" cy="118" r="2" fill="white" />
        
        {/* Picture-Perfect Smile */}
        <path d="M 143 130 Q 150 135 157 130" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="150" cy="132" rx="2" ry="1" fill="#F87171" />
        
        {/* Graceful Tail */}
        <path 
          d="M 175 155 Q 190 145 185 130" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="5" 
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* Camera with Love */}
      <g style={{ animation: 'heart-beat 2.5s ease-in-out infinite' }}>
        <rect x="70" y="70" width="30" height="20" rx="5" fill={illustrationColors.petFur.brown} />
        <circle cx="85" cy="80" r="8" fill="#1F2937" />
        <circle cx="85" cy="80" r="4" fill={illustrationColors.accents.sparkle} />
        <rect x="78" y="65" width="14" height="5" rx="2" fill={illustrationColors.petFur.brown} />
        
        {/* Love Coming from Camera */}
        <path 
          d="M 90 75 C 88 72, 84 72, 85 76 C 82 72, 78 72, 79 76 C 79 79, 85 82, 85 82 C 85 82, 91 79, 91 76 Z" 
          fill={illustrationColors.accents.heart}
          style={{ animation: 'heart-beat 1.5s ease-in-out infinite' }}
        />
      </g>
      
      {/* Floating Photo Frames */}
      {Array.from({ length: 4 }).map((_, i) => (
        <g 
          key={i}
          style={{ 
            animation: `gentle-float ${2.5 + i * 0.3}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.4}s`
          }}
        >
          <rect 
            x={200 + i * 15} 
            y={90 + i * 20} 
            width="25" 
            height="20" 
            rx="2" 
            fill="white"
            stroke={illustrationColors.petFur.golden}
            strokeWidth="1"
          />
          <circle 
            cx={212 + i * 15} 
            cy={100 + i * 20} 
            r="6" 
            fill={illustrationColors.accents.heart}
            opacity={0.7 - i * 0.1}
          />
        </g>
      ))}
      
      {/* Social Sharing Hearts */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        const x = 150 + 70 * Math.cos((angle * Math.PI) / 180);
        const y = 140 + 50 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <path 
            key={i}
            d={`M ${x} ${y} C ${x-2} ${y-2}, ${x-4} ${y-2}, ${x-3} ${y+1} C ${x-5} ${y-2}, ${x-7} ${y-2}, ${x-6} ${y+1} C ${x-6} ${y+3}, ${x-3} ${y+5}, ${x-3} ${y+5} C ${x-3} ${y+5}, ${x} ${y+3}, ${x} ${y+1} Z`}
            fill={illustrationColors.accents.heart}
            opacity={0.6}
            style={{ 
              animation: `heart-beat ${1.8 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        );
      })}
      
      {/* Sparkle Effects */}
      {Array.from({ length: 12 }).map((_, i) => (
        <circle 
          key={i}
          cx={60 + i * 20} 
          cy={200 + Math.sin(i) * 15} 
          r={1 + Math.cos(i) * 0.5} 
          fill={illustrationColors.accents.sparkle}
          style={{ 
            animation: `twinkle ${1.2 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      
      {/* Sharing Text */}
      <text 
        x="150" 
        y="240" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.states.excited}
      >
        Share the love! 📸💕
      </text>
      
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Your pet's cutest moments deserve to be shared
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * Memory Album Illustration
 * Shows a collection of precious pet memories
 */
export const MemoryAlbum: React.FC = () => (
  <IllustrationContainer size="large" mood="premium" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Album Background */}
      <rect 
        x="50" 
        y="80" 
        width="200" 
        height="140" 
        rx="10" 
        fill={illustrationColors.environments.home}
        stroke={illustrationColors.petFur.golden}
        strokeWidth="3"
      />
      
      {/* Album Binding */}
      <rect 
        x="45" 
        y="80" 
        width="10" 
        height="140" 
        rx="5" 
        fill={illustrationColors.petFur.brown}
      />
      
      {/* Photo Grid */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        {/* Photo 1 - Playing */}
        <rect x="70" y="100" width="40" height="35" rx="3" fill="white" />
        <circle cx="90" cy="117" r="12" fill={illustrationColors.petFur.golden} />
        <circle cx="85" cy="113" r="2" fill={illustrationColors.eyes.warm} />
        <circle cx="95" cy="113" r="2" fill={illustrationColors.eyes.warm} />
        <path d="M 85 120 Q 90 123 95 120" stroke="#1F2937" strokeWidth="1" fill="none" />
        
        {/* Photo 2 - Sleeping */}
        <rect x="130" y="100" width="40" height="35" rx="3" fill="white" />
        <ellipse cx="150" cy="117" rx="10" ry="8" fill={illustrationColors.petFur.gray} />
        <ellipse cx="146" cy="115" rx="2" ry="1" fill={illustrationColors.eyes.gentle} />
        <ellipse cx="154" cy="115" rx="2" ry="1" fill={illustrationColors.eyes.gentle} />
        
        {/* Photo 3 - Adventure */}
        <rect x="190" y="100" width="40" height="35" rx="3" fill="white" />
        <circle cx="210" cy="117" r="10" fill={illustrationColors.petFur.golden} />
        <path d="M 200 125 Q 210 115 220 125" stroke={illustrationColors.environments.park} strokeWidth="2" fill="none" />
        
        {/* Photo 4 - With Family */}
        <rect x="70" y="155" width="40" height="35" rx="3" fill="white" />
        <circle cx="80" cy="172" r="6" fill={illustrationColors.environments.home} />
        <circle cx="90" cy="172" r="8" fill={illustrationColors.petFur.golden} />
        <circle cx="100" cy="172" r="6" fill={illustrationColors.environments.home} />
        
        {/* Photo 5 - Birthday */}
        <rect x="130" y="155" width="40" height="35" rx="3" fill="white" />
        <circle cx="150" cy="172" r="10" fill={illustrationColors.petFur.golden} />
        <polygon points="145,165 150,160 155,165" fill={illustrationColors.accents.star} />
        <circle cx="140" cy="165" r="2" fill={illustrationColors.accents.heart} />
        <circle cx="160" cy="165" r="2" fill={illustrationColors.accents.heart} />
        
        {/* Photo 6 - Latest */}
        <rect x="190" y="155" width="40" height="35" rx="3" fill="white" />
        <circle cx="210" cy="172" r="10" fill={illustrationColors.petFur.golden} />
        <circle cx="206" cy="168" r="2" fill={illustrationColors.eyes.warm} />
        <circle cx="214" cy="168" r="2" fill={illustrationColors.eyes.warm} />
        <path d="M 206 176 Q 210 179 214 176" stroke="#1F2937" strokeWidth="1" fill="none" />
      </g>
      
      {/* Memory Hearts Floating */}
      {Array.from({ length: 6 }).map((_, i) => (
        <path 
          key={i}
          d={`M ${60 + i * 35} ${50 + i * 5} C ${58 + i * 35} 47, ${54 + i * 35} 47, ${56 + i * 35} 52 C ${52 + i * 35} 47, ${48 + i * 35} 47, ${50 + i * 35} 52 C ${50 + i * 35} 57, ${56 + i * 35} 62, ${56 + i * 35} 62 C ${56 + i * 35} 62, ${62 + i * 35} 57, ${62 + i * 35} 52 Z`}
          fill={illustrationColors.accents.heart}
          opacity={0.7 - i * 0.1}
          style={{ 
            animation: `heart-beat ${2 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
      
      {/* Timeline Sparkles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <circle 
          key={i}
          cx={55 + i * 20} 
          cy={240 + Math.sin(i) * 5} 
          r={1 + Math.cos(i) * 0.3} 
          fill={illustrationColors.accents.sparkle}
          style={{ 
            animation: `twinkle ${1.5 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      
      {/* Album Title */}
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.petFur.golden}
      >
        Precious Memories 📖
      </text>
      
      <text 
        x="150" 
        y="280" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Every moment tells a story
      </text>
    </svg>
  </IllustrationContainer>
);

// ====================================
// LOCATION & TRACKING ILLUSTRATIONS
// ====================================

/**
 * Safe Zone Setup Illustration
 * Shows setting up a safe zone for peace of mind
 */
export const SafeZoneSetup: React.FC = () => (
  <IllustrationContainer size="large" mood="safe" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Map Background */}
      <rect 
        x="40" 
        y="60" 
        width="220" 
        height="160" 
        rx="15" 
        fill={illustrationColors.environments.park}
        stroke={illustrationColors.states.happy}
        strokeWidth="2"
      />
      
      {/* Safe Zone Circle */}
      <circle 
        cx="150" 
        cy="140" 
        r="60" 
        fill={illustrationColors.environments.safe}
        stroke={illustrationColors.states.happy}
        strokeWidth="4"
        strokeDasharray="10,5"
        opacity="0.6"
        style={{ animation: 'heart-beat 3s ease-in-out infinite' }}
      />
      
      {/* Home Icon in Center */}
      <g style={{ animation: 'gentle-float 2.5s ease-in-out infinite alternate' }}>
        <rect x="135" y="125" width="30" height="20" rx="5" fill={illustrationColors.environments.home} />
        <polygon points="135,125 150,110 165,125" fill={illustrationColors.petFur.brown} />
        <rect x="145" y="135" width="10" height="10" rx="2" fill={illustrationColors.petFur.brown} />
        <circle cx="150" cy="140" r="2" fill={illustrationColors.accents.heart} />
      </g>
      
      {/* Happy Pet Inside Safe Zone */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        <ellipse cx="120" cy="165" rx="15" ry="12" fill={illustrationColors.petFur.golden} />
        <circle cx="120" cy="150" r="12" fill={illustrationColors.petFur.golden} />
        
        {/* Content Eyes */}
        <circle cx="116" cy="147" r="2" fill={illustrationColors.eyes.warm} />
        <circle cx="124" cy="147" r="2" fill={illustrationColors.eyes.warm} />
        <circle cx="116.5" cy="146" r="1" fill="white" />
        <circle cx="124.5" cy="146" r="1" fill="white" />
        
        {/* Peaceful Expression */}
        <path d="M 117 152 Q 120 154 123 152" stroke="#1F2937" strokeWidth="1" fill="none" />
        
        {/* Relaxed Tail */}
        <path 
          d="M 132 160 Q 140 155 138 145" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* GPS Satellites */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i * 360) / 4;
        const x = 150 + 100 * Math.cos((angle * Math.PI) / 180);
        const y = 140 + 80 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <g 
            key={i}
            style={{ 
              animation: `twinkle ${2 + i * 0.3}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.4}s`
            }}
          >
            <rect x={x-3} y={y-3} width="6" height="6" fill={illustrationColors.accents.star} />
            <line x1={x} y1={y} x2="150" y2="140" stroke={illustrationColors.accents.star} strokeWidth="1" opacity="0.5" />
          </g>
        );
      })}
      
      {/* Protection Shields */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 360) / 6;
        const x = 150 + 75 * Math.cos((angle * Math.PI) / 180);
        const y = 140 + 75 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <g 
            key={i}
            style={{ 
              animation: `heart-beat ${1.5 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          >
            <path 
              d={`M ${x} ${y-4} L ${x+3} ${y} L ${x} ${y+4} L ${x-3} ${y} Z`}
              fill={illustrationColors.states.happy}
              opacity="0.7"
            />
          </g>
        );
      })}
      
      {/* Comfort Hearts */}
      {Array.from({ length: 3 }).map((_, i) => (
        <path 
          key={i}
          d={`M ${80 + i * 60} ${40 + i * 10} C ${78 + i * 60} 37, ${74 + i * 60} 37, ${76 + i * 60} 42 C ${72 + i * 60} 37, ${68 + i * 60} 37, ${70 + i * 60} 42 C ${70 + i * 60} 47, ${76 + i * 60} 52, ${76 + i * 60} 52 C ${76 + i * 60} 52, ${82 + i * 60} 47, ${82 + i * 60} 42 Z`}
          fill={illustrationColors.accents.heart}
          opacity="0.8"
          style={{ 
            animation: `heart-beat ${2.5 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`
          }}
        />
      ))}
      
      {/* Peace of Mind Text */}
      <text 
        x="150" 
        y="250" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.states.happy}
      >
        Safe zone activated! 🛡️
      </text>
      
      <text 
        x="150" 
        y="270" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Your pet is protected and you have peace of mind
      </text>
    </svg>
  </IllustrationContainer>
);

export default {
  PhotoSharingJoy,
  MemoryAlbum,
  SafeZoneSetup,
};