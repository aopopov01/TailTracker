/**
 * TailTracker Feature Illustrations
 * 
 * These illustrations explain key app features while maintaining emotional warmth.
 * Each illustration should make users feel that TailTracker is a caring, expert
 * partner in their pet's health and happiness journey.
 * 
 * EMOTIONAL GOALS:
 * - Trust in app's expertise and reliability
 * - Comfort with health and safety features
 * - Excitement about sharing pet moments
 * - Confidence in tracking and monitoring
 */

import React from 'react';
import { illustrationColors, IllustrationContainer } from '../IllustrationSystem';

// ====================================
// HEALTH TRACKING ILLUSTRATIONS
// ====================================

/**
 * Health Dashboard Illustration
 * Shows a pet with health monitoring in a warm, caring way
 */
export const HealthDashboard: React.FC = () => (
  <IllustrationContainer size="large" mood="safe" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Medical Background - Soft and Welcoming */}
      <rect 
        x="40" 
        y="60" 
        width="220" 
        height="180" 
        rx="20" 
        fill={illustrationColors.environments.vet}
        stroke={illustrationColors.states.calm}
        strokeWidth="2"
      />
      
      {/* Healthy Happy Pet */}
      <g style={{ animation: 'gentle-float 2.5s ease-in-out infinite alternate' }}>
        {/* Dog Body */}
        <ellipse cx="150" cy="180" rx="35" ry="25" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="140" r="28" fill={illustrationColors.petFur.golden} />
        
        {/* Healthy Ears */}
        <ellipse cx="132" cy="125" rx="8" ry="15" fill={illustrationColors.petFur.brown} transform="rotate(-20 132 125)" />
        <ellipse cx="168" cy="125" rx="8" ry="15" fill={illustrationColors.petFur.brown} transform="rotate(20 168 125)" />
        
        {/* Bright, Healthy Eyes */}
        <circle cx="142" cy="135" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="158" cy="135" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="144" cy="132" r="2.5" fill="white" />
        <circle cx="160" cy="132" r="2.5" fill="white" />
        
        {/* Content, Healthy Expression */}
        <ellipse cx="150" cy="145" rx="3" ry="2" fill="#1F2937" />
        <path d="M 145 150 Q 150 153 155 150" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Gently Wagging Tail - Sign of Good Health */}
        <path 
          d="M 180 175 Q 200 165 195 145" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
          style={{
            transformOrigin: '180px 175px',
            animation: 'tail-wag 2s ease-in-out infinite'
          }}
        />
      </g>
      
      {/* Health Metrics - Gentle and Reassuring */}
      <g style={{ animation: 'heart-beat 3s ease-in-out infinite' }}>
        {/* Heart Rate Monitor */}
        <circle cx="80" cy="100" r="15" fill={illustrationColors.states.happy} />
        <path d="M 75 100 L 77 97 L 79 103 L 81 97 L 83 100 L 85 100" 
              stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Temperature */}
        <circle cx="220" cy="100" r="15" fill={illustrationColors.accents.star} />
        <rect x="217" y="95" width="6" height="10" rx="3" fill="white" />
        <circle cx="220" cy="102" r="3" fill="white" />
        
        {/* Weight Scale */}
        <circle cx="80" cy="200" r="15" fill={illustrationColors.states.calm} />
        <rect x="75" y="197" width="10" height="6" rx="1" fill="white" />
        
        {/* Activity Level */}
        <circle cx="220" cy="200" r="15" fill={illustrationColors.accents.sparkle} />
        <path d="M 215 200 L 220 195 L 225 200 L 220 205 Z" fill="white" />
      </g>
      
      {/* Health Status Indicators */}
      <g style={{ animation: 'twinkle 2s ease-in-out infinite alternate' }}>
        <circle cx="60" cy="140" r="4" fill={illustrationColors.states.happy} />
        <circle cx="240" cy="140" r="4" fill={illustrationColors.states.happy} />
        <circle cx="60" cy="160" r="4" fill={illustrationColors.states.happy} />
        <circle cx="240" cy="160" r="4" fill={illustrationColors.states.happy} />
      </g>
      
      {/* Caring Stethoscope */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        <circle cx="120" cy="170" r="8" fill={illustrationColors.petFur.brown} />
        <path d="M 120 162 Q 110 150 100 140" stroke={illustrationColors.petFur.brown} strokeWidth="3" fill="none" />
        <path d="M 120 162 Q 130 150 140 140" stroke={illustrationColors.petFur.brown} strokeWidth="3" fill="none" />
        <circle cx="100" cy="140" r="4" fill={illustrationColors.petFur.brown} />
        <circle cx="140" cy="140" r="4" fill={illustrationColors.petFur.brown} />
      </g>
      
      {/* Reassuring Text */}
      <text 
        x="150" 
        y="270" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.states.calm}
      >
        Keeping your best friend healthy! 💚
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * Vaccination Reminder Illustration
 * Gentle reminder about vaccinations with positive, caring tone
 */
export const VaccinationReminder: React.FC = () => (
  <IllustrationContainer size="large" mood="safe" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Protective Shield Background */}
      <circle 
        cx="150" 
        cy="150" 
        r="120" 
        fill={illustrationColors.environments.safe}
        stroke={illustrationColors.states.happy}
        strokeWidth="3"
        strokeDasharray="10,5"
        style={{ animation: 'gentle-float 4s ease-in-out infinite alternate' }}
      />
      
      {/* Protected Pet - Happy and Safe */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        {/* Pet Body */}
        <ellipse cx="150" cy="170" rx="30" ry="22" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="130" r="25" fill={illustrationColors.petFur.golden} />
        
        {/* Alert but Calm Ears */}
        <ellipse cx="135" cy="115" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(-15 135 115)" />
        <ellipse cx="165" cy="115" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(15 165 115)" />
        
        {/* Trusting Eyes */}
        <circle cx="143" cy="125" r="5" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="125" r="5" fill={illustrationColors.eyes.warm} />
        <circle cx="144.5" cy="123" r="2" fill="white" />
        <circle cx="158.5" cy="123" r="2" fill="white" />
        
        {/* Calm Expression */}
        <ellipse cx="150" cy="135" rx="2.5" ry="2" fill="#1F2937" />
        <path d="M 147 140 Q 150 142 153 140" stroke="#1F2937" strokeWidth="1.5" fill="none" />
        
        {/* Relaxed Tail */}
        <path 
          d="M 175 165 Q 190 155 185 140" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="5" 
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* Gentle Vaccination Syringe */}
      <g style={{ animation: 'heart-beat 3s ease-in-out infinite' }}>
        <rect x="200" y="90" width="15" height="40" rx="3" fill={illustrationColors.accents.star} />
        <circle cx="207.5" cy="85" r="5" fill={illustrationColors.states.calm} />
        <rect x="205" y="130" width="5" height="8" fill={illustrationColors.states.calm} />
        
        {/* Sparkles Around Syringe - Magic Protection */}
        <circle cx="190" cy="80" r="1.5" fill={illustrationColors.accents.sparkle} />
        <circle cx="225" cy="95" r="1" fill={illustrationColors.accents.sparkle} />
        <circle cx="195" cy="110" r="1.2" fill={illustrationColors.accents.sparkle} />
      </g>
      
      {/* Protective Hearts */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 360) / 6;
        const x = 150 + 90 * Math.cos((angle * Math.PI) / 180);
        const y = 150 + 90 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <path 
            key={i}
            d={`M ${x} ${y} C ${x-2} ${y-3}, ${x-6} ${y-3}, ${x-4} ${y+1} C ${x-8} ${y-3}, ${x-12} ${y-3}, ${x-10} ${y+1} C ${x-10} ${y+5}, ${x-4} ${y+8}, ${x-4} ${y+8} C ${x-4} ${y+8}, ${x+2} ${y+5}, ${x+2} ${y+1} Z`}
            fill={illustrationColors.accents.heart}
            opacity="0.7"
            style={{ 
              animation: `heart-beat ${2 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        );
      })}
      
      {/* Calendar Reminder */}
      <g style={{ animation: 'twinkle 2.5s ease-in-out infinite alternate' }}>
        <rect x="70" y="80" width="30" height="25" rx="3" fill={illustrationColors.environments.home} />
        <rect x="72" y="75" width="26" height="8" rx="2" fill={illustrationColors.states.happy} />
        <circle cx="80" cy="92" r="2" fill={illustrationColors.accents.heart} />
        <circle cx="90" cy="92" r="2" fill={illustrationColors.accents.heart} />
      </g>
      
      {/* Reassuring Text */}
      <text 
        x="150" 
        y="250" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.states.happy}
      >
        Time for protection! 🛡️
      </text>
      
      <text 
        x="150" 
        y="270" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Keeping your pet safe and healthy
      </text>
    </svg>
  </IllustrationContainer>
);

// ====================================
// LOST PET ALERT ILLUSTRATIONS
// ====================================

/**
 * Lost Pet Alert Illustration
 * Urgent but hopeful - shows search and reunion themes
 */
export const LostPetAlert: React.FC = () => (
  <IllustrationContainer size="large" mood="safe" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Alert Background - Urgent but Not Panicked */}
      <circle 
        cx="150" 
        cy="150" 
        r="130" 
        fill={illustrationColors.environments.safe}
        stroke={illustrationColors.states.alert}
        strokeWidth="4"
        strokeDasharray="15,10"
        style={{ 
          animation: 'heart-beat 2s ease-in-out infinite',
          opacity: 0.3
        }}
      />
      
      {/* Search Flashlight */}
      <g style={{ animation: 'gentle-float 2s ease-in-out infinite alternate' }}>
        <rect x="80" y="60" width="12" height="40" rx="6" fill={illustrationColors.petFur.brown} />
        <circle cx="86" cy="100" r="8" fill={illustrationColors.accents.star} />
        
        {/* Light Beam */}
        <polygon 
          points="78,108 94,108 110,140 66,140" 
          fill={illustrationColors.accents.star}
          opacity="0.4"
        />
      </g>
      
      {/* Missing Pet Silhouette */}
      <g style={{ animation: 'twinkle 3s ease-in-out infinite alternate' }}>
        {/* Pet Shadow/Silhouette */}
        <ellipse cx="150" cy="180" rx="25" ry="18" fill={illustrationColors.petFur.brown} opacity="0.6" />
        <circle cx="150" cy="150" r="20" fill={illustrationColors.petFur.brown} opacity="0.6" />
        <ellipse cx="138" cy="138" rx="6" ry="10" fill={illustrationColors.petFur.brown} opacity="0.6" transform="rotate(-15 138 138)" />
        <ellipse cx="162" cy="138" rx="6" ry="10" fill={illustrationColors.petFur.brown} opacity="0.6" transform="rotate(15 162 138)" />
        
        {/* Question Mark Over Pet */}
        <text 
          x="170" 
          y="145" 
          fontSize="24" 
          fontWeight="bold" 
          fill={illustrationColors.states.alert}
          style={{ animation: 'heart-beat 1.5s ease-in-out infinite' }}
        >
          ?
        </text>
      </g>
      
      {/* GPS Search Indicators */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i * 360) / 4;
        const x = 150 + 80 * Math.cos((angle * Math.PI) / 180);
        const y = 150 + 80 * Math.sin((angle * Math.PI) / 180);
        
        return (
          <g 
            key={i}
            style={{ 
              animation: `twinkle ${1.5 + i * 0.3}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.5}s`
            }}
          >
            <circle cx={x} cy={y} r="6" fill={illustrationColors.states.alert} />
            <circle cx={x} cy={y} r="3" fill="white" />
          </g>
        );
      })}
      
      {/* Search Radius Circles */}
      <circle 
        cx="150" 
        cy="150" 
        r="60" 
        fill="none"
        stroke={illustrationColors.states.alert}
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.5"
        style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}
      />
      
      <circle 
        cx="150" 
        cy="150" 
        r="90" 
        fill="none"
        stroke={illustrationColors.states.alert}
        strokeWidth="1"
        strokeDasharray="8,8"
        opacity="0.3"
        style={{ animation: 'gentle-float 4s ease-in-out infinite alternate reverse' }}
      />
      
      {/* Hope Hearts */}
      {Array.from({ length: 3 }).map((_, i) => (
        <path 
          key={i}
          d={`M ${220 + i * 10} ${80 + i * 15} C ${218 + i * 10} 77, ${214 + i * 10} 77, ${216 + i * 10} 82 C ${212 + i * 10} 77, ${208 + i * 10} 77, ${210 + i * 10} 82 C ${210 + i * 10} 87, ${216 + i * 10} 90, ${216 + i * 10} 90 C ${216 + i * 10} 90, ${222 + i * 10} 87, ${222 + i * 10} 82 Z`}
          fill={illustrationColors.accents.heart}
          opacity="0.8"
          style={{ 
            animation: `heart-beat ${2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`
          }}
        />
      ))}
      
      {/* Urgent but Hopeful Text */}
      <text 
        x="150" 
        y="250" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill={illustrationColors.states.alert}
      >
        Don't worry - we'll find them! 🔍
      </text>
      
      <text 
        x="150" 
        y="270" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        TailTracker is searching everywhere
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * Happy Reunion Illustration
 * Celebrates when a lost pet is found
 */
export const HappyReunion: React.FC = () => (
  <IllustrationContainer size="large" mood="happy" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Celebration Burst Background */}
      <defs>
        <radialGradient id="reunion-joy" cx="50%" cy="50%">
          <stop offset="0%" stopColor={illustrationColors.accents.star} stopOpacity="0.6" />
          <stop offset="50%" stopColor={illustrationColors.accents.heart} stopOpacity="0.3" />
          <stop offset="100%" stopColor={illustrationColors.environments.home} stopOpacity="0.1" />
        </radialGradient>
      </defs>
      
      <circle cx="150" cy="150" r="140" fill="url(#reunion-joy)" />
      
      {/* Ecstatic Pet Running Home */}
      <g style={{ animation: 'gentle-float 1s ease-in-out infinite alternate' }}>
        {/* Pet Body in Motion */}
        <ellipse cx="150" cy="170" rx="32" ry="20" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="135" r="24" fill={illustrationColors.petFur.golden} />
        
        {/* Ears Flying */}
        <ellipse cx="132" cy="120" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(-30 132 120)" />
        <ellipse cx="168" cy="120" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(30 168 120)" />
        
        {/* Eyes Full of Joy */}
        <circle cx="143" cy="130" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="130" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="144.5" cy="127" r="3" fill="white" />
        <circle cx="158.5" cy="127" r="3" fill="white" />
        
        {/* Huge Happy Smile */}
        <path d="M 140 145 Q 150 155 160 145" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="150" cy="150" rx="4" ry="3" fill="#F87171" />
        
        {/* Tail Wagging Frantically */}
        <path 
          d="M 180 165 Q 200 150 195 130" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
          style={{
            transformOrigin: '180px 165px',
            animation: 'tail-wag 0.3s ease-in-out infinite'
          }}
        />
      </g>
      
      {/* Human Arms Welcoming */}
      <g style={{ animation: 'heart-beat 2s ease-in-out infinite' }}>
        <ellipse cx="80" cy="180" rx="15" ry="25" fill={illustrationColors.environments.home} />
        <ellipse cx="220" cy="180" rx="15" ry="25" fill={illustrationColors.environments.home} />
        <circle cx="80" cy="155" r="8" fill={illustrationColors.environments.home} />
        <circle cx="220" cy="155" r="8" fill={illustrationColors.environments.home} />
      </g>
      
      {/* Explosion of Hearts */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 360) / 12;
        const x = 150 + (60 + i * 5) * Math.cos((angle * Math.PI) / 180);
        const y = 150 + (60 + i * 5) * Math.sin((angle * Math.PI) / 180);
        
        return (
          <path 
            key={i}
            d={`M ${x} ${y} C ${x-3} ${y-4}, ${x-8} ${y-4}, ${x-6} ${y+1} C ${x-10} ${y-4}, ${x-15} ${y-4}, ${x-13} ${y+1} C ${x-13} ${y+6}, ${x-6} ${y+10}, ${x-6} ${y+10} C ${x-6} ${y+10}, ${x+1} ${y+6}, ${x+1} ${y+1} Z`}
            fill={illustrationColors.accents.heart}
            opacity={0.8 - i * 0.04}
            style={{ 
              animation: `heart-beat ${1 + i * 0.1}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        );
      })}
      
      {/* Celebration Confetti */}
      {Array.from({ length: 20 }).map((_, i) => (
        <rect 
          key={i}
          x={50 + i * 10} 
          y={60 + (i % 5) * 15} 
          width="3" 
          height="3" 
          fill={[
            illustrationColors.accents.star,
            illustrationColors.accents.sparkle,
            illustrationColors.states.happy,
            illustrationColors.accents.heart
          ][i % 4]}
          transform={`rotate(${i * 18} ${50 + i * 10} ${60 + (i % 5) * 15})`}
          style={{ 
            animation: `twinkle ${0.8 + i * 0.05}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.05}s`
          }}
        />
      ))}
      
      {/* Joyful Text */}
      <text 
        x="150" 
        y="250" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="bold" 
        fill={illustrationColors.states.happy}
      >
        FOUND! Welcome home! 🎉
      </text>
      
      <text 
        x="150" 
        y="270" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        The family is together again
      </text>
    </svg>
  </IllustrationContainer>
);

export default {
  HealthDashboard,
  VaccinationReminder,
  LostPetAlert,
  HappyReunion,
};