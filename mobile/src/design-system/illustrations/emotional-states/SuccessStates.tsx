/**
 * TailTracker Success State Illustrations
 * 
 * These illustrations celebrate achievements, milestones, and positive moments
 * in the pet care journey. Each success should feel like a shared victory
 * between the pet parent and TailTracker.
 */

import React from 'react';
import { illustrationColors, IllustrationContainer } from '../IllustrationSystem';

// ====================================
// ACHIEVEMENT SUCCESS ILLUSTRATIONS
// ====================================

/**
 * Daily Goal Achievement
 * Celebrates reaching daily activity goals
 */
export const DailyGoalAchieved: React.FC = () => (
  <IllustrationContainer size="large" mood="happy" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Achievement Burst Background */}
      <defs>
        <radialGradient id="achievement-burst" cx="50%" cy="50%">
          <stop offset="0%" stopColor={illustrationColors.accents.star} stopOpacity="0.8" />
          <stop offset="50%" stopColor={illustrationColors.states.happy} stopOpacity="0.4" />
          <stop offset="100%" stopColor={illustrationColors.environments.play} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <circle cx="150" cy="150" r="130" fill="url(#achievement-burst)" />
      
      {/* Triumphant Pet */}
      <g style={{ animation: 'gentle-float 1.5s ease-in-out infinite alternate' }}>
        {/* Pet Body - Proud Stance */}
        <ellipse cx="150" cy="170" rx="30" ry="22" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="135" r="24" fill={illustrationColors.petFur.golden} />
        
        {/* Proud, Alert Ears */}
        <ellipse cx="133" cy="120" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(-5 133 120)" />
        <ellipse cx="167" cy="120" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(5 167 120)" />
        
        {/* Bright, Proud Eyes */}
        <circle cx="143" cy="130" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="130" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="144.5" cy="127" r="2.5" fill="white" />
        <circle cx="158.5" cy="127" r="2.5" fill="white" />
        
        {/* Achievement Star Pupils */}
        <path d="M 143 130 L 144 128 L 145 130 L 147 130 L 145 131 L 146 133 L 143 132 L 140 133 L 141 131 L 139 130 Z" fill="white" />
        <path d="M 157 130 L 158 128 L 159 130 L 161 130 L 159 131 L 160 133 L 157 132 L 154 133 L 155 131 L 153 130 Z" fill="white" />
        
        {/* Victory Smile */}
        <path d="M 142 145 Q 150 152 158 145" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="150" cy="148" rx="3" ry="2" fill="#F87171" />
        
        {/* Championship Tail */}
        <path 
          d="M 175 165 Q 195 150 190 130" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
          style={{
            transformOrigin: '175px 165px',
            animation: 'tail-wag 0.6s ease-in-out infinite'
          }}
        />
      </g>
      
      {/* Achievement Badge */}
      <g style={{ animation: 'heart-beat 2s ease-in-out infinite' }}>
        <circle cx="150" cy="80" r="25" fill={illustrationColors.accents.star} />
        <circle cx="150" cy="80" r="20" fill="white" />
        <text x="150" y="88" textAnchor="middle" fontSize="20" fill={illustrationColors.accents.star}>🏆</text>
      </g>
      
      {/* Celebration Confetti */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 360) / 16;
        const x = 150 + (80 + i * 3) * Math.cos((angle * Math.PI) / 180);
        const y = 150 + (80 + i * 3) * Math.sin((angle * Math.PI) / 180);
        const colors = [
          illustrationColors.accents.star,
          illustrationColors.accents.heart,
          illustrationColors.states.happy,
          illustrationColors.accents.sparkle
        ];
        
        return (
          <rect 
            key={i}
            x={x - 2} 
            y={y - 2} 
            width="4" 
            height="4" 
            fill={colors[i % colors.length]}
            transform={`rotate(${i * 22.5} ${x} ${y})`}
            style={{ 
              animation: `twinkle ${0.8 + i * 0.05}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.05}s`
            }}
          />
        );
      })}
      
      {/* Victory Stars */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 360) / 6;
        const x = 150 + 50 * Math.cos((angle * Math.PI) / 180);
        const y = 150 + 50 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <g 
            key={i}
            style={{ 
              animation: `gentle-float ${2 + i * 0.2}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.3}s`
            }}
          >
            <path 
              d={`M ${x} ${y-6} L ${x+2} ${y-2} L ${x+6} ${y-2} L ${x+3} ${y+1} L ${x+4} ${y+5} L ${x} ${y+3} L ${x-4} ${y+5} L ${x-3} ${y+1} L ${x-6} ${y-2} L ${x-2} ${y-2} Z`}
              fill={illustrationColors.accents.star}
              opacity="0.8"
            />
          </g>
        );
      })}
      
      {/* Achievement Text */}
      <text 
        x="150" 
        y="230" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="bold" 
        fill={illustrationColors.states.happy}
      >
        Goal Achieved! 🎉
      </text>
      
      <text 
        x="150" 
        y="250" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Your pet had an amazing active day!
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * Health Milestone Success
 * Celebrates health checkups and wellness achievements
 */
export const HealthMilestone: React.FC = () => (
  <IllustrationContainer size="large" mood="safe" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Health Glow Background */}
      <defs>
        <radialGradient id="health-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor={illustrationColors.states.happy} stopOpacity="0.6" />
          <stop offset="70%" stopColor={illustrationColors.environments.safe} stopOpacity="0.3" />
          <stop offset="100%" stopColor={illustrationColors.environments.vet} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <circle cx="150" cy="150" r="120" fill="url(#health-glow)" />
      
      {/* Healthy, Happy Pet */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        {/* Pet Body - Vibrant Health */}
        <ellipse cx="150" cy="165" rx="28" ry="20" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="130" r="22" fill={illustrationColors.petFur.golden} />
        
        {/* Healthy Ears */}
        <ellipse cx="135" cy="115" rx="6" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(-10 135 115)" />
        <ellipse cx="165" cy="115" rx="6" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(10 165 115)" />
        
        {/* Bright, Healthy Eyes */}
        <circle cx="143" cy="125" r="5" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="125" r="5" fill={illustrationColors.eyes.warm} />
        <circle cx="144" cy="123" r="2" fill="white" />
        <circle cx="158" cy="123" r="2" fill="white" />
        
        {/* Healthy Shine in Eyes */}
        <circle cx="145" cy="122" r="0.8" fill="white" opacity="0.8" />
        <circle cx="159" cy="122" r="0.8" fill="white" opacity="0.8" />
        
        {/* Content, Healthy Expression */}
        <ellipse cx="150" cy="135" rx="2" ry="1.5" fill="#1F2937" />
        <path d="M 146 140 Q 150 143 154 140" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Healthy, Relaxed Tail */}
        <path 
          d="M 172 160 Q 185 150 182 135" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="5" 
          fill="none"
          strokeLinecap="round"
          style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}
        />
      </g>
      
      {/* Health Cross Symbol */}
      <g style={{ animation: 'heart-beat 3s ease-in-out infinite' }}>
        <circle cx="150" cy="80" r="20" fill={illustrationColors.states.happy} />
        <rect x="145" y="70" width="10" height="20" rx="2" fill="white" />
        <rect x="140" y="75" width="20" height="10" rx="2" fill="white" />
      </g>
      
      {/* Wellness Indicators */}
      <g style={{ animation: 'twinkle 2.5s ease-in-out infinite alternate' }}>
        {/* Heart Rate - Healthy */}
        <circle cx="80" cy="120" r="12" fill={illustrationColors.states.happy} />
        <path d="M 75 120 L 77 117 L 79 123 L 81 117 L 83 120 L 85 120" 
              stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Temperature - Normal */}
        <circle cx="220" cy="120" r="12" fill={illustrationColors.accents.star} />
        <rect x="217" y="115" width="6" height="10" rx="3" fill="white" />
        <circle cx="220" cy="122" r="2.5" fill="white" />
        
        {/* Weight - Perfect */}
        <circle cx="80" cy="180" r="12" fill={illustrationColors.states.calm} />
        <rect x="75" y="177" width="10" height="6" rx="1" fill="white" />
        
        {/* Energy - High */}
        <circle cx="220" cy="180" r="12" fill={illustrationColors.accents.sparkle} />
        <polygon points="216,180 220,175 224,180 220,185" fill="white" />
      </g>
      
      {/* Health Sparkles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 360) / 12;
        const x = 150 + 70 * Math.cos((angle * Math.PI) / 180);
        const y = 150 + 70 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <circle 
            key={i}
            cx={x} 
            cy={y} 
            r={2 + Math.sin(i) * 0.5} 
            fill={illustrationColors.states.happy}
            opacity="0.7"
            style={{ 
              animation: `twinkle ${1.5 + i * 0.1}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        );
      })}
      
      {/* Wellness Text */}
      <text 
        x="150" 
        y="220" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="bold" 
        fill={illustrationColors.states.happy}
      >
        Perfect Health! 💚
      </text>
      
      <text 
        x="150" 
        y="240" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Your pet is thriving and healthy
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * Data Sync Success
 * Celebrates successful data synchronization
 */
export const DataSyncSuccess: React.FC = () => (
  <IllustrationContainer size="medium" mood="premium" animated>
    <svg viewBox="0 0 200 200" style={{ width: '90%', height: '90%' }}>
      {/* Sync Success Background */}
      <circle 
        cx="100" 
        cy="100" 
        r="85" 
        fill={illustrationColors.environments.home}
        opacity="0.4"
        style={{ animation: 'heart-beat 3s ease-in-out infinite' }}
      />
      
      {/* Happy Pet with Data */}
      <g style={{ animation: 'gentle-float 2.5s ease-in-out infinite alternate' }}>
        {/* Pet Body */}
        <ellipse cx="100" cy="120" rx="22" ry="16" fill={illustrationColors.petFur.golden} />
        <circle cx="100" cy="90" r="18" fill={illustrationColors.petFur.golden} />
        
        {/* Satisfied Ears */}
        <ellipse cx="88" cy="78" rx="5" ry="8" fill={illustrationColors.petFur.brown} transform="rotate(-15 88 78)" />
        <ellipse cx="112" cy="78" rx="5" ry="8" fill={illustrationColors.petFur.brown} transform="rotate(15 112 78)" />
        
        {/* Content Eyes */}
        <circle cx="95" cy="85" r="4" fill={illustrationColors.eyes.warm} />
        <circle cx="105" cy="85" r="4" fill={illustrationColors.eyes.warm} />
        <circle cx="96" cy="83" r="1.5" fill="white" />
        <circle cx="106" cy="83" r="1.5" fill="white" />
        
        {/* Peaceful Expression */}
        <ellipse cx="100" cy="95" rx="1.5" ry="1" fill="#1F2937" />
        <path d="M 97 100 Q 100 102 103 100" stroke="#1F2937" strokeWidth="1.5" fill="none" />
        
        {/* Calm Tail */}
        <path 
          d="M 118 115 Q 128 110 125 100" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="4" 
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* Sync Symbol */}
      <g style={{ animation: 'heart-beat 2s ease-in-out infinite' }}>
        <circle cx="100" cy="50" r="15" fill={illustrationColors.accents.star} />
        <path d="M 92 50 Q 100 42 108 50 Q 100 58 92 50" 
              stroke="white" strokeWidth="2" fill="none" />
        <polygon points="105,45 110,50 105,55" fill="white" />
        <polygon points="95,45 90,50 95,55" fill="white" />
      </g>
      
      {/* Data Points Flowing */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 360) / 8;
        const x = 100 + 40 * Math.cos((angle * Math.PI) / 180);
        const y = 100 + 40 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <circle 
            key={i}
            cx={x} 
            cy={y} 
            r="2" 
            fill={illustrationColors.accents.sparkle}
            style={{ 
              animation: `twinkle ${1 + i * 0.1}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.125}s`
            }}
          />
        );
      })}
      
      {/* Success Checkmark */}
      <g style={{ animation: 'heart-beat 1.5s ease-in-out infinite' }}>
        <circle cx="130" cy="70" r="8" fill={illustrationColors.states.happy} />
        <path d="M 127 70 L 129 72 L 133 68" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      
      {/* Sync Text */}
      <text 
        x="100" 
        y="160" 
        textAnchor="middle" 
        fontSize="12" 
        fontWeight="bold" 
        fill={illustrationColors.accents.star}
      >
        All synced! ✅
      </text>
      
      <text 
        x="100" 
        y="175" 
        textAnchor="middle" 
        fontSize="10" 
        fill={illustrationColors.petFur.brown}
      >
        Your pet's data is safe and updated
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * Subscription Success
 * Celebrates successful premium subscription
 */
export const SubscriptionSuccess: React.FC = () => (
  <IllustrationContainer size="large" mood="premium" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Premium Gold Background */}
      <defs>
        <radialGradient id="premium-success" cx="50%" cy="50%">
          <stop offset="0%" stopColor={illustrationColors.accents.star} stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FDE047" stopOpacity="0.4" />
          <stop offset="100%" stopColor={illustrationColors.environments.home} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <circle cx="150" cy="150" r="130" fill="url(#premium-success)" />
      
      {/* VIP Pet */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        {/* Pet Body - Premium Groomed */}
        <ellipse cx="150" cy="165" rx="30" ry="22" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="130" r="24" fill={illustrationColors.petFur.golden} />
        
        {/* Perfect Ears */}
        <ellipse cx="133" cy="115" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(-8 133 115)" />
        <ellipse cx="167" cy="115" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(8 167 115)" />
        
        {/* Sparkling Eyes */}
        <circle cx="143" cy="125" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="125" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="144.5" cy="122" r="2.5" fill="white" />
        <circle cx="158.5" cy="122" r="2.5" fill="white" />
        
        {/* Star Pupils for Premium */}
        <path d="M 143 125 L 144 123 L 145 125 L 147 125 L 145 126 L 146 128 L 143 127 L 140 128 L 141 126 L 139 125 Z" fill="#FDE047" />
        <path d="M 157 125 L 158 123 L 159 125 L 161 125 L 159 126 L 160 128 L 157 127 L 154 128 L 155 126 L 153 125 Z" fill="#FDE047" />
        
        {/* Premium Smile */}
        <path d="M 142 140 Q 150 147 158 140" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="150" cy="143" rx="3" ry="2" fill="#F87171" />
        
        {/* Regal Tail */}
        <path 
          d="M 175 160 Q 195 145 190 125" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
          style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}
        />
      </g>
      
      {/* Premium Crown */}
      <g style={{ animation: 'heart-beat 2.5s ease-in-out infinite' }}>
        <path d="M 135 85 L 140 75 L 145 85 L 150 70 L 155 85 L 160 75 L 165 85 L 150 95 Z" 
              fill={illustrationColors.accents.star} stroke="#FDE047" strokeWidth="2" />
        <circle cx="140" cy="80" r="2" fill="#FDE047" />
        <circle cx="150" cy="75" r="3" fill="#FDE047" />
        <circle cx="160" cy="80" r="2" fill="#FDE047" />
      </g>
      
      {/* Premium Features Floating */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        {/* Advanced Analytics */}
        <circle cx="80" cy="100" r="12" fill={illustrationColors.accents.star} />
        <rect x="76" y="96" width="8" height="8" rx="1" fill="white" />
        <rect x="77" y="101" width="2" height="3" fill={illustrationColors.accents.star} />
        <rect x="80" y="99" width="2" height="5" fill={illustrationColors.accents.star} />
        <rect x="83" y="97" width="2" height="7" fill={illustrationColors.accents.star} />
        
        {/* Premium Support */}
        <circle cx="220" cy="100" r="12" fill={illustrationColors.accents.heart} />
        <path d="M 215 100 C 213 97, 209 97, 211 102 C 207 97, 203 97, 205 102 C 205 107, 211 112, 211 112 C 211 112, 217 107, 217 102 Z" 
              fill="white" />
        
        {/* Unlimited Features */}
        <circle cx="80" cy="200" r="12" fill={illustrationColors.accents.sparkle} />
        <text x="80" y="205" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">∞</text>
        
        {/* Priority Care */}
        <circle cx="220" cy="200" r="12" fill="#FDE047" />
        <path d="M 220 195 L 222 200 L 227 200 L 223 203 L 225 208 L 220 205 L 215 208 L 217 203 L 213 200 L 218 200 Z" fill="white" />
      </g>
      
      {/* Golden Sparkles */}
      {Array.from({ length: 16 }).map((_, i) => (
        <circle 
          key={i}
          cx={60 + i * 15} 
          cy={50 + Math.sin(i * 0.5) * 30} 
          r={1.5 + Math.cos(i) * 0.5} 
          fill="#FDE047"
          style={{ 
            animation: `twinkle ${1.2 + i * 0.05}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.08}s`
          }}
        />
      ))}
      
      {/* Premium Text */}
      <text 
        x="150" 
        y="240" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="bold" 
        fill={illustrationColors.accents.star}
      >
        Welcome to Premium! 👑
      </text>
      
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Your pet now has access to exclusive care features
      </text>
    </svg>
  </IllustrationContainer>
);

export default {
  DailyGoalAchieved,
  HealthMilestone,
  DataSyncSuccess,
  SubscriptionSuccess,
};