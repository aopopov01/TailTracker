/**
 * TailTracker Emotional State Illustrations
 * 
 * These illustrations handle the critical emotional moments in the app:
 * - Empty states that encourage and inspire rather than disappoint
 * - Error states that comfort and reassure rather than blame
 * - Loading states that entertain and delight rather than frustrate
 * - Success states that celebrate achievements and milestones
 * 
 * EMOTIONAL DESIGN PRINCIPLE:
 * Every state should reinforce the bond between pet and owner, and make
 * users feel that TailTracker truly cares about their pet's wellbeing.
 */

import React from 'react';
import { illustrationColors, IllustrationContainer } from '../IllustrationSystem';

// ====================================
// EMPTY STATE ILLUSTRATIONS
// ====================================

/**
 * No Pets Yet - Encouraging Empty State
 * Shows a welcoming space waiting for a pet to join
 */
export const NoPetsYet: React.FC = () => (
  <IllustrationContainer size="large" mood="calm" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Welcoming Background */}
      <defs>
        <radialGradient id="welcome-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor={illustrationColors.environments.home} stopOpacity="0.6" />
          <stop offset="100%" stopColor={illustrationColors.environments.home} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <circle cx="150" cy="150" r="120" fill="url(#welcome-glow)" />
      
      {/* Empty Pet Bed - Waiting */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        <ellipse cx="150" cy="180" rx="50" ry="20" fill={illustrationColors.petFur.cream} />
        <ellipse cx="150" cy="175" rx="45" ry="15" fill={illustrationColors.petFur.brown} />
        
        {/* Cozy Blanket */}
        <path 
          d="M 120 170 Q 140 165 160 170 Q 180 175 160 180 Q 140 185 120 180 Q 100 175 120 170" 
          fill={illustrationColors.accents.heart}
          opacity="0.7"
        />
        
        {/* Heart Pattern on Blanket */}
        <circle cx="135" cy="175" r="3" fill={illustrationColors.accents.heart} opacity="0.5" />
        <circle cx="165" cy="175" r="3" fill={illustrationColors.accents.heart} opacity="0.5" />
      </g>
      
      {/* Floating Pet Silhouettes - Possibilities */}
      <g style={{ animation: 'gentle-float 4s ease-in-out infinite alternate' }}>
        {/* Dog Silhouette */}
        <g opacity="0.3">
          <ellipse cx="80" cy="120" rx="15" ry="12" fill={illustrationColors.petFur.golden} />
          <circle cx="80" cy="100" r="12" fill={illustrationColors.petFur.golden} />
          <ellipse cx="73" cy="92" rx="4" ry="7" fill={illustrationColors.petFur.golden} transform="rotate(-15 73 92)" />
          <ellipse cx="87" cy="92" rx="4" ry="7" fill={illustrationColors.petFur.golden} transform="rotate(15 87 92)" />
        </g>
        
        {/* Cat Silhouette */}
        <g opacity="0.3" style={{ animationDelay: '1s' }}>
          <ellipse cx="220" cy="120" rx="14" ry="10" fill={illustrationColors.petFur.gray} />
          <circle cx="220" cy="105" r="10" fill={illustrationColors.petFur.gray} />
          <polygon points="212,98 217,88 222,98" fill={illustrationColors.petFur.gray} />
          <polygon points="218,98 223,88 228,98" fill={illustrationColors.petFur.gray} />
        </g>
        
        {/* Bird Silhouette */}
        <g opacity="0.3" style={{ animationDelay: '2s' }}>
          <ellipse cx="150" cy="80" rx="8" ry="6" fill={illustrationColors.petFur.orange} />
          <circle cx="145" cy="76" r="5" fill={illustrationColors.petFur.orange} />
          <path d="M 152 74 Q 158 72 156 78" fill={illustrationColors.petFur.orange} />
        </g>
      </g>
      
      {/* Invitation Hearts */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        const x = 150 + 60 * Math.cos((angle * Math.PI) / 180);
        const y = 150 + 60 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <path 
            key={i}
            d={`M ${x} ${y} C ${x-2} ${y-2}, ${x-4} ${y-2}, ${x-3} ${y+1} C ${x-5} ${y-2}, ${x-7} ${y-2}, ${x-6} ${y+1} C ${x-6} ${y+3}, ${x-3} ${y+5}, ${x-3} ${y+5} C ${x-3} ${y+5}, ${x} ${y+3}, ${x} ${y+1} Z`}
            fill={illustrationColors.accents.heart}
            opacity="0.4"
            style={{ 
              animation: `heart-beat ${2 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        );
      })}
      
      {/* Sparkles of Possibility */}
      {Array.from({ length: 10 }).map((_, i) => (
        <circle 
          key={i}
          cx={70 + i * 16} 
          cy={220 + Math.sin(i) * 10} 
          r={1 + Math.cos(i) * 0.5} 
          fill={illustrationColors.accents.sparkle}
          style={{ 
            animation: `twinkle ${1.5 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      
      {/* Encouraging Text */}
      <text 
        x="150" 
        y="240" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="bold" 
        fill={illustrationColors.accents.sparkle}
      >
        Your pet family awaits! ✨
      </text>
      
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Add your first furry friend to begin the journey
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * No Activities Yet - Encouraging Exploration
 * Shows a pet ready for adventure
 */
export const NoActivitiesYet: React.FC = () => (
  <IllustrationContainer size="large" mood="playful" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Adventure Background */}
      <circle 
        cx="150" 
        cy="150" 
        r="110" 
        fill={illustrationColors.environments.park}
        opacity="0.3"
        style={{ animation: 'gentle-float 4s ease-in-out infinite alternate' }}
      />
      
      {/* Eager Pet Ready for Adventure */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        {/* Pet Body */}
        <ellipse cx="150" cy="170" rx="30" ry="22" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="135" r="25" fill={illustrationColors.petFur.golden} />
        
        {/* Alert, Excited Ears */}
        <ellipse cx="132" cy="120" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(-10 132 120)" />
        <ellipse cx="168" cy="120" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(10 168 120)" />
        
        {/* Bright, Anticipating Eyes */}
        <circle cx="143" cy="130" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="130" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="144.5" cy="127" r="2.5" fill="white" />
        <circle cx="158.5" cy="127" r="2.5" fill="white" />
        
        {/* Excited Expression */}
        <ellipse cx="150" cy="140" rx="3" ry="2" fill="#1F2937" />
        <path d="M 145 145 Q 150 150 155 145" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="150" cy="147" rx="2" ry="1.5" fill="#F87171" />
        
        {/* Enthusiastic Tail */}
        <path 
          d="M 175 165 Q 195 155 190 135" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
          style={{
            transformOrigin: '175px 165px',
            animation: 'tail-wag 1s ease-in-out infinite'
          }}
        />
      </g>
      
      {/* Adventure Items Floating */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        {/* Ball */}
        <circle cx="80" cy="100" r="12" fill={illustrationColors.accents.star} />
        <circle cx="77" cy="97" r="3" fill="white" opacity="0.8" />
        
        {/* Frisbee */}
        <ellipse cx="220" cy="110" rx="15" ry="5" fill={illustrationColors.states.excited} />
        <ellipse cx="220" cy="110" rx="10" ry="3" fill="white" opacity="0.6" />
        
        {/* Leash */}
        <path 
          d="M 100 200 Q 120 180 140 200" 
          stroke={illustrationColors.petFur.brown} 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="100" cy="200" r="4" fill={illustrationColors.petFur.brown} />
      </g>
      
      {/* Path Leading to Adventure */}
      <path 
        d="M 50 220 Q 100 200 150 220 Q 200 240 250 220" 
        stroke={illustrationColors.environments.park} 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        strokeDasharray="15,10"
        style={{ animation: 'gentle-float 4s ease-in-out infinite alternate' }}
      />
      
      {/* Paw Prints on Path */}
      {Array.from({ length: 5 }).map((_, i) => (
        <g 
          key={i}
          style={{ 
            animation: `twinkle ${2 + i * 0.2}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`
          }}
        >
          <circle cx={70 + i * 30} cy={215 + (i % 2) * 8} r="2" fill={illustrationColors.petFur.brown} opacity="0.6" />
          <circle cx={72 + i * 30} cy={212 + (i % 2) * 8} r="1" fill={illustrationColors.petFur.brown} opacity="0.6" />
          <circle cx={68 + i * 30} cy={212 + (i % 2) * 8} r="1" fill={illustrationColors.petFur.brown} opacity="0.6" />
        </g>
      ))}
      
      {/* Excitement Sparkles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <circle 
          key={i}
          cx={60 + i * 18} 
          cy={60 + Math.sin(i) * 20} 
          r={1 + Math.cos(i) * 0.5} 
          fill={illustrationColors.accents.sparkle}
          style={{ 
            animation: `twinkle ${1.2 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      
      {/* Encouraging Text */}
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.states.excited}
      >
        Ready for adventure! 🎾
      </text>
      
      <text 
        x="150" 
        y="280" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Start tracking your pet's activities and create memories
      </text>
    </svg>
  </IllustrationContainer>
);

// ====================================
// ERROR STATE ILLUSTRATIONS
// ====================================

/**
 * Connection Error - Comforting and Reassuring
 * Shows that the issue is temporary and we're working on it
 */
export const ConnectionError: React.FC = () => (
  <IllustrationContainer size="large" mood="calm" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Soft Error Background */}
      <circle 
        cx="150" 
        cy="150" 
        r="120" 
        fill={illustrationColors.environments.rest}
        opacity="0.4"
        style={{ animation: 'heart-beat 4s ease-in-out infinite' }}
      />
      
      {/* Gentle Pet - Slightly Concerned but Hopeful */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        {/* Pet Body */}
        <ellipse cx="150" cy="170" rx="28" ry="20" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="135" r="23" fill={illustrationColors.petFur.golden} />
        
        {/* Slightly Drooped Ears */}
        <ellipse cx="135" cy="122" rx="6" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(-25 135 122)" />
        <ellipse cx="165" cy="122" rx="6" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(25 165 122)" />
        
        {/* Concerned but Trusting Eyes */}
        <ellipse cx="143" cy="130" rx="5" ry="6" fill={illustrationColors.eyes.warm} />
        <ellipse cx="157" cy="130" rx="5" ry="6" fill={illustrationColors.eyes.warm} />
        <circle cx="144" cy="128" r="2" fill="white" />
        <circle cx="158" cy="128" r="2" fill="white" />
        
        {/* Gentle, Understanding Expression */}
        <ellipse cx="150" cy="140" rx="2" ry="1.5" fill="#1F2937" />
        <path d="M 147 145 Q 150 147 153 145" stroke="#1F2937" strokeWidth="1.5" fill="none" />
        
        {/* Still Tail - Waiting Patiently */}
        <path 
          d="M 172 165 Q 185 155 182 145" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="5" 
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* Broken Connection Visualization */}
      <g style={{ animation: 'twinkle 2s ease-in-out infinite alternate' }}>
        {/* Signal Bars - Some Missing */}
        <rect x="100" y="90" width="4" height="10" fill={illustrationColors.states.calm} />
        <rect x="106" y="85" width="4" height="15" fill={illustrationColors.states.calm} />
        <rect x="112" y="80" width="4" height="20" fill={illustrationColors.petFur.gray} opacity="0.3" />
        <rect x="118" y="75" width="4" height="25" fill={illustrationColors.petFur.gray} opacity="0.3" />
        
        {/* Reconnecting Dots */}
        <circle cx="130" cy="85" r="2" fill={illustrationColors.states.calm} />
        <circle cx="135" cy="85" r="2" fill={illustrationColors.states.calm} opacity="0.6" />
        <circle cx="140" cy="85" r="2" fill={illustrationColors.states.calm} opacity="0.3" />
      </g>
      
      {/* Comforting Elements */}
      <g style={{ animation: 'heart-beat 3s ease-in-out infinite' }}>
        {/* Patience Symbol */}
        <circle cx="200" cy="100" r="15" fill={illustrationColors.accents.sparkle} opacity="0.7" />
        <path d="M 200 90 L 200 100 L 207 105" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Care Heart */}
        <path 
          d="M 80 180 C 78 177, 74 177, 76 182 C 72 177, 68 177, 70 182 C 70 187, 76 192, 76 192 C 76 192, 82 187, 82 182 Z" 
          fill={illustrationColors.accents.heart}
          opacity="0.8"
        />
      </g>
      
      {/* Gentle Sparkles - Hope */}
      {Array.from({ length: 8 }).map((_, i) => (
        <circle 
          key={i}
          cx={80 + i * 20} 
          cy={220 + Math.sin(i) * 8} 
          r={1 + Math.cos(i) * 0.3} 
          fill={illustrationColors.accents.sparkle}
          opacity="0.6"
          style={{ 
            animation: `twinkle ${2 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
      
      {/* Reassuring Text */}
      <text 
        x="150" 
        y="240" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.states.calm}
      >
        Taking a little break 🌙
      </text>
      
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        We'll be back to caring for your pet in just a moment
      </text>
    </svg>
  </IllustrationContainer>
);

// ====================================
// LOADING STATE ILLUSTRATIONS
// ====================================

/**
 * Loading with Playful Pet
 * Entertaining loading animation that delights rather than frustrates
 */
export const PlayfulLoading: React.FC = () => (
  <IllustrationContainer size="large" mood="playful" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Loading Background */}
      <circle 
        cx="150" 
        cy="150" 
        r="100" 
        fill={illustrationColors.environments.play}
        opacity="0.3"
        style={{ 
          animation: 'gentle-float 2s ease-in-out infinite alternate',
          transformOrigin: '150px 150px'
        }}
      />
      
      {/* Pet Chasing Loading Dots */}
      <g style={{ 
        animation: 'gentle-float 1.5s ease-in-out infinite alternate',
        transformOrigin: '150px 150px'
      }}>
        {/* Pet Body */}
        <ellipse cx="150" cy="170" rx="25" ry="18" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="140" r="20" fill={illustrationColors.petFur.golden} />
        
        {/* Playful Ears */}
        <ellipse cx="135" cy="128" rx="6" ry="10" fill={illustrationColors.petFur.brown} 
                 transform="rotate(-20 135 128)"
                 style={{ animation: 'tail-wag 1s ease-in-out infinite' }} />
        <ellipse cx="165" cy="128" rx="6" ry="10" fill={illustrationColors.petFur.brown}
                 transform="rotate(20 165 128)"
                 style={{ animation: 'tail-wag 1s ease-in-out infinite', animationDelay: '0.2s' }} />
        
        {/* Focused, Playful Eyes */}
        <circle cx="143" cy="135" r="4" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="135" r="4" fill={illustrationColors.eyes.warm} />
        <circle cx="144" cy="133" r="1.5" fill="white" />
        <circle cx="158" cy="133" r="1.5" fill="white" />
        
        {/* Playful Expression */}
        <ellipse cx="150" cy="145" rx="2" ry="1.5" fill="#1F2937" />
        <path d="M 146 150 Q 150 153 154 150" stroke="#1F2937" strokeWidth="1.5" fill="none" />
        <ellipse cx="150" cy="151" rx="1.5" ry="1" fill="#F87171" />
        
        {/* Active Tail */}
        <path 
          d="M 172 165 Q 190 155 185 140" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="5" 
          fill="none"
          strokeLinecap="round"
          style={{
            transformOrigin: '172px 165px',
            animation: 'tail-wag 0.8s ease-in-out infinite'
          }}
        />
      </g>
      
      {/* Loading Dots in Circle - Pet is Chasing Them */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        const x = 150 + 60 * Math.cos((angle * Math.PI) / 180);
        const y = 150 + 60 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <circle 
            key={i}
            cx={x} 
            cy={y} 
            r="6" 
            fill={illustrationColors.accents.star}
            style={{ 
              animation: `twinkle ${0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
              transformOrigin: '150px 150px'
            }}
          />
        );
      })}
      
      {/* Playful Sparkles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <circle 
          key={i}
          cx={70 + i * 16} 
          cy={80 + Math.sin(i * 2) * 15} 
          r={1 + Math.sin(i) * 0.5} 
          fill={illustrationColors.accents.sparkle}
          style={{ 
            animation: `twinkle ${1 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.05}s`
          }}
        />
      ))}
      
      {/* Fun Loading Text */}
      <text 
        x="150" 
        y="240" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.states.excited}
      >
        Playing while we load! 🎾
      </text>
      
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Your pet's data is almost ready
      </text>
    </svg>
  </IllustrationContainer>
);

export default {
  NoPetsYet,
  NoActivitiesYet,
  ConnectionError,
  PlayfulLoading,
};