/**
 * TailTracker Premium Feature Illustrations
 * 
 * These illustrations make premium features feel special, exclusive, and worth the investment.
 * They should convey luxury and enhanced care while maintaining the warm, emotional
 * connection that defines TailTracker's brand.
 * 
 * PREMIUM DESIGN PRINCIPLES:
 * - Golden accents and sophisticated color palette
 * - Enhanced detail and refinement in illustrations
 * - Sense of exclusivity and privilege
 * - Premium care and attention for beloved pets
 */

import React from 'react';
import { illustrationColors, IllustrationContainer } from '../IllustrationSystem';

// ====================================
// PREMIUM UPGRADE ILLUSTRATIONS
// ====================================

/**
 * Premium Upgrade Invitation
 * Enticing illustration that shows the value of premium features
 */
export const PremiumUpgradeInvitation: React.FC = () => (
  <IllustrationContainer size="large" mood="premium" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Premium Golden Background */}
      <defs>
        <radialGradient id="premium-invitation" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
          <stop offset="40%" stopColor={illustrationColors.accents.star} stopOpacity="0.6" />
          <stop offset="100%" stopColor={illustrationColors.environments.home} stopOpacity="0.2" />
        </radialGradient>
        
        <filter id="premium-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="150" cy="150" r="140" fill="url(#premium-invitation)" />
      
      {/* Luxurious Pet Portrait */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        {/* Premium Pet Body */}
        <ellipse cx="150" cy="170" rx="35" ry="25" fill={illustrationColors.petFur.golden} filter="url(#premium-glow)" />
        <circle cx="150" cy="130" r="28" fill={illustrationColors.petFur.golden} filter="url(#premium-glow)" />
        
        {/* Elegant Ears with Golden Trim */}
        <ellipse cx="130" cy="115" rx="8" ry="15" fill={illustrationColors.petFur.brown} transform="rotate(-12 130 115)" />
        <ellipse cx="170" cy="115" rx="8" ry="15" fill={illustrationColors.petFur.brown} transform="rotate(12 170 115)" />
        <ellipse cx="132" cy="115" rx="4" ry="8" fill="#FDE047" transform="rotate(-12 132 115)" opacity="0.6" />
        <ellipse cx="168" cy="115" rx="4" ry="8" fill="#FDE047" transform="rotate(12 168 115)" opacity="0.6" />
        
        {/* Sophisticated Eyes with Golden Flecks */}
        <circle cx="142" cy="125" r="7" fill={illustrationColors.eyes.warm} />
        <circle cx="158" cy="125" r="7" fill={illustrationColors.eyes.warm} />
        <circle cx="144" cy="122" r="3" fill="white" />
        <circle cx="160" cy="122" r="3" fill="white" />
        
        {/* Golden Sparkle in Eyes */}
        <circle cx="143" cy="120" r="1" fill="#FDE047" />
        <circle cx="159" cy="120" r="1" fill="#FDE047" />
        
        {/* Refined Expression */}
        <ellipse cx="150" cy="135" rx="3" ry="2" fill="#1F2937" />
        <path d="M 145 140 Q 150 144 155 140" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Majestic Tail */}
        <path 
          d="M 180 165 Q 205 150 200 125" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="7" 
          fill="none"
          strokeLinecap="round"
          filter="url(#premium-glow)"
          style={{ animation: 'gentle-float 4s ease-in-out infinite alternate' }}
        />
      </g>
      
      {/* Premium Crown */}
      <g style={{ animation: 'heart-beat 3s ease-in-out infinite' }}>
        <path d="M 130 90 L 135 75 L 142 88 L 150 70 L 158 88 L 165 75 L 170 90 L 150 100 Z" 
              fill="#FDE047" stroke={illustrationColors.accents.star} strokeWidth="2" filter="url(#premium-glow)" />
        
        {/* Crown Jewels */}
        <circle cx="135" cy="82" r="3" fill={illustrationColors.accents.sparkle} />
        <circle cx="150" cy="75" r="4" fill={illustrationColors.accents.heart} />
        <circle cx="165" cy="82" r="3" fill={illustrationColors.accents.sparkle} />
      </g>
      
      {/* Premium Feature Icons Orbiting */}
      {[
        { icon: '🏥', label: 'Advanced Health', angle: 0 },
        { icon: '📊', label: 'Analytics', angle: 72 },
        { icon: '🎯', label: 'Smart Goals', angle: 144 },
        { icon: '🚨', label: 'Priority Alerts', angle: 216 },
        { icon: '👥', label: 'Expert Support', angle: 288 }
      ].map((feature, i) => {
        const x = 150 + 80 * Math.cos((feature.angle * Math.PI) / 180);
        const y = 150 + 80 * Math.sin((feature.angle * Math.PI) / 180);
        
        return (
          <g 
            key={i}
            style={{ 
              animation: `gentle-float ${3 + i * 0.2}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.4}s`
            }}
          >
            <circle cx={x} cy={y} r="18" fill="#FDE047" opacity="0.9" filter="url(#premium-glow)" />
            <text x={x} y={y + 2} textAnchor="middle" fontSize="16">{feature.icon}</text>
          </g>
        );
      })}
      
      {/* Luxury Sparkles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <circle 
          key={i}
          cx={50 + i * 12} 
          cy={40 + Math.sin(i * 0.8) * 40} 
          r={1.5 + Math.cos(i) * 0.8} 
          fill="#FDE047"
          opacity={0.7 + Math.sin(i) * 0.3}
          style={{ 
            animation: `twinkle ${1.5 + i * 0.05}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.08}s`
          }}
        />
      ))}
      
      {/* Premium Invitation Text */}
      <text 
        x="150" 
        y="230" 
        textAnchor="middle" 
        fontSize="18" 
        fontWeight="bold" 
        fill="#FDE047"
        filter="url(#premium-glow)"
      >
        Upgrade to Premium ✨
      </text>
      
      <text 
        x="150" 
        y="250" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Give your pet the royal treatment they deserve
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * Advanced Health Monitoring - Premium Feature
 * Shows sophisticated health tracking capabilities
 */
export const AdvancedHealthMonitoring: React.FC = () => (
  <IllustrationContainer size="large" mood="premium" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Advanced Medical Background */}
      <defs>
        <linearGradient id="health-premium" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={illustrationColors.environments.vet} stopOpacity="0.6" />
          <stop offset="50%" stopColor="#FDE047" stopOpacity="0.3" />
          <stop offset="100%" stopColor={illustrationColors.states.happy} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      
      <rect x="40" y="60" width="220" height="180" rx="20" fill="url(#health-premium)" />
      
      {/* Premium Health Dashboard */}
      <g style={{ animation: 'gentle-float 4s ease-in-out infinite alternate' }}>
        {/* Central Pet - Monitored */}
        <ellipse cx="150" cy="170" rx="30" ry="22" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="135" r="25" fill={illustrationColors.petFur.golden} />
        
        {/* Alert, Healthy Ears */}
        <ellipse cx="132" cy="120" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(-10 132 120)" />
        <ellipse cx="168" cy="120" rx="7" ry="12" fill={illustrationColors.petFur.brown} transform="rotate(10 168 120)" />
        
        {/* Bright, Monitored Eyes */}
        <circle cx="143" cy="130" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="157" cy="130" r="6" fill={illustrationColors.eyes.warm} />
        <circle cx="144.5" cy="127" r="2.5" fill="white" />
        <circle cx="158.5" cy="127" r="2.5" fill="white" />
        
        {/* Digital Health Indicators in Eyes */}
        <rect x="142" y="128" width="2" height="1" fill="#FDE047" />
        <rect x="156" y="128" width="2" height="1" fill="#FDE047" />
        
        {/* Content Expression */}
        <ellipse cx="150" cy="140" rx="3" ry="2" fill="#1F2937" />
        <path d="M 146 145 Q 150 148 154 145" stroke="#1F2937" strokeWidth="2" fill="none" />
        
        {/* Monitored Tail */}
        <path 
          d="M 175 165 Q 195 155 190 135" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* Advanced Health Metrics */}
      <g style={{ animation: 'twinkle 3s ease-in-out infinite alternate' }}>
        {/* Heart Rate Variability */}
        <circle cx="80" cy="100" r="16" fill="#FDE047" />
        <path d="M 72 100 L 74 97 L 76 103 L 78 94 L 80 106 L 82 97 L 84 103 L 86 100 L 88 100" 
              stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Body Temperature Trends */}
        <circle cx="220" cy="100" r="16" fill={illustrationColors.accents.heart} />
        <path d="M 215 95 Q 220 90 225 95 Q 220 100 215 95" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="220" cy="102" r="4" fill="white" />
        <rect x="218" y="98" width="4" height="8" fill="white" />
        
        {/* Activity Pattern Analysis */}
        <circle cx="80" cy="180" r="16" fill={illustrationColors.accents.sparkle} />
        <rect x="75" y="175" width="2" height="8" fill="white" />
        <rect x="78" y="177" width="2" height="6" fill="white" />
        <rect x="81" y="173" width="2" height="10" fill="white" />
        <rect x="84" y="176" width="2" height="7" fill="white" />
        
        {/* Sleep Quality Monitoring */}
        <circle cx="220" cy="180" r="16" fill={illustrationColors.states.calm} />
        <path d="M 215 180 Q 218 177 221 180 Q 224 183 227 180" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="218" cy="178" r="1" fill="white" />
        <circle cx="224" cy="182" r="1" fill="white" />
      </g>
      
      {/* AI Analysis Indicators */}
      <g style={{ animation: 'heart-beat 4s ease-in-out infinite' }}>
        {/* AI Brain Symbol */}
        <circle cx="150" cy="80" r="20" fill="#FDE047" />
        <path d="M 140 80 Q 150 70 160 80 Q 150 90 140 80" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="145" cy="78" r="2" fill="white" />
        <circle cx="155" cy="78" r="2" fill="white" />
        <circle cx="150" cy="85" r="2" fill="white" />
        
        {/* Neural Network Connections */}
        <line x1="150" y1="100" x2="80" y2="116" stroke="#FDE047" strokeWidth="1" opacity="0.6" />
        <line x1="150" y1="100" x2="220" y2="116" stroke="#FDE047" strokeWidth="1" opacity="0.6" />
        <line x1="150" y1="100" x2="80" y2="164" stroke="#FDE047" strokeWidth="1" opacity="0.6" />
        <line x1="150" y1="100" x2="220" y2="164" stroke="#FDE047" strokeWidth="1" opacity="0.6" />
      </g>
      
      {/* Premium Data Visualization */}
      <g style={{ animation: 'gentle-float 5s ease-in-out infinite alternate' }}>
        {/* Trend Lines */}
        <path d="M 60 200 Q 100 190 140 200 Q 180 210 220 200" 
              stroke="#FDE047" strokeWidth="2" fill="none" opacity="0.7" />
        <path d="M 60 210 Q 100 200 140 210 Q 180 220 220 210" 
              stroke={illustrationColors.accents.sparkle} strokeWidth="2" fill="none" opacity="0.7" />
      </g>
      
      {/* Premium Text */}
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="14" 
        fontWeight="bold" 
        fill="#FDE047"
      >
        AI-Powered Health Intelligence 🧠
      </text>
    </svg>
  </IllustrationContainer>
);

/**
 * Premium Support Concierge
 * Shows exclusive access to expert pet care support
 */
export const PremiumSupport: React.FC = () => (
  <IllustrationContainer size="large" mood="premium" animated>
    <svg viewBox="0 0 300 300" style={{ width: '90%', height: '90%' }}>
      {/* Luxurious Support Background */}
      <defs>
        <radialGradient id="support-luxury" cx="50%" cy="50%">
          <stop offset="0%" stopColor={illustrationColors.accents.heart} stopOpacity="0.6" />
          <stop offset="60%" stopColor="#FDE047" stopOpacity="0.4" />
          <stop offset="100%" stopColor={illustrationColors.environments.home} stopOpacity="0.2" />
        </radialGradient>
      </defs>
      
      <circle cx="150" cy="150" r="130" fill="url(#support-luxury)" />
      
      {/* VIP Pet with Care Team */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        {/* Pampered Pet */}
        <ellipse cx="150" cy="160" rx="28" ry="20" fill={illustrationColors.petFur.golden} />
        <circle cx="150" cy="125" r="22" fill={illustrationColors.petFur.golden} />
        
        {/* Relaxed, Pampered Ears */}
        <ellipse cx="135" cy="112" rx="6" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(-15 135 112)" />
        <ellipse cx="165" cy="112" rx="6" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(15 165 112)" />
        
        {/* Content, Cared-for Eyes */}
        <ellipse cx="143" cy="120" rx="4" ry="5" fill={illustrationColors.eyes.warm} />
        <ellipse cx="157" cy="120" rx="4" ry="5" fill={illustrationColors.eyes.warm} />
        <circle cx="144" cy="118" r="1.5" fill="white" />
        <circle cx="158" cy="118" r="1.5" fill="white" />
        
        {/* Peaceful Expression */}
        <ellipse cx="150" cy="130" rx="2" ry="1.5" fill="#1F2937" />
        <path d="M 147 135 Q 150 137 153 135" stroke="#1F2937" strokeWidth="1.5" fill="none" />
        
        {/* Relaxed Tail */}
        <path 
          d="M 172 155 Q 185 150 182 135" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="5" 
          fill="none"
          strokeLinecap="round"
        />
      </g>
      
      {/* Premium Care Team */}
      <g style={{ animation: 'heart-beat 4s ease-in-out infinite' }}>
        {/* Veterinarian */}
        <circle cx="80" cy="120" r="18" fill={illustrationColors.environments.home} />
        <circle cx="80" cy="105" r="12" fill={illustrationColors.environments.home} />
        <rect x="75" y="118" width="10" height="4" rx="2" fill="white" />
        <circle cx="80" cy="115" r="6" fill="white" />
        <text x="80" y="110" textAnchor="middle" fontSize="8" fill={illustrationColors.states.happy}>🩺</text>
        
        {/* Nutritionist */}
        <circle cx="220" cy="120" r="18" fill={illustrationColors.states.happy} />
        <circle cx="220" cy="105" r="12" fill={illustrationColors.states.happy} />
        <text x="220" y="110" textAnchor="middle" fontSize="12" fill="white">🥗</text>
        
        {/* Behaviorist */}
        <circle cx="80" cy="200" r="18" fill={illustrationColors.accents.sparkle} />
        <circle cx="80" cy="185" r="12" fill={illustrationColors.accents.sparkle} />
        <text x="80" y="190" textAnchor="middle" fontSize="12" fill="white">🧠</text>
        
        {/* 24/7 Support */}
        <circle cx="220" cy="200" r="18" fill="#FDE047" />
        <circle cx="220" cy="185" r="12" fill="#FDE047" />
        <text x="220" y="190" textAnchor="middle" fontSize="12" fill="white">24</text>
        <text x="220" y="202" textAnchor="middle" fontSize="8" fill="white">7</text>
      </g>
      
      {/* Care Connections */}
      <g style={{ animation: 'twinkle 3s ease-in-out infinite alternate' }}>
        <line x1="98" y1="120" x2="132" y2="140" stroke={illustrationColors.accents.heart} strokeWidth="2" opacity="0.6" />
        <line x1="202" y1="120" x2="168" y2="140" stroke={illustrationColors.accents.heart} strokeWidth="2" opacity="0.6" />
        <line x1="98" y1="200" x2="132" y2="175" stroke={illustrationColors.accents.heart} strokeWidth="2" opacity="0.6" />
        <line x1="202" y1="200" x2="168" y2="175" stroke={illustrationColors.accents.heart} strokeWidth="2" opacity="0.6" />
        
        {/* Care Hearts Flowing */}
        <circle cx="115" cy="130" r="2" fill={illustrationColors.accents.heart} />
        <circle cx="185" cy="130" r="2" fill={illustrationColors.accents.heart} />
        <circle cx="115" cy="190" r="2" fill={illustrationColors.accents.heart} />
        <circle cx="185" cy="190" r="2" fill={illustrationColors.accents.heart} />
      </g>
      
      {/* Premium Badge */}
      <g style={{ animation: 'heart-beat 2.5s ease-in-out infinite' }}>
        <circle cx="150" cy="60" r="20" fill="#FDE047" />
        <path d="M 140 60 L 145 50 L 150 55 L 155 50 L 160 60 L 150 70 Z" fill="white" />
        <text x="150" y="65" textAnchor="middle" fontSize="12" fill="#FDE047">VIP</text>
      </g>
      
      {/* Luxury Sparkles */}
      {Array.from({ length: 16 }).map((_, i) => (
        <circle 
          key={i}
          cx={60 + i * 15} 
          cy={40 + Math.sin(i * 0.6) * 25} 
          r={1 + Math.cos(i) * 0.5} 
          fill={illustrationColors.accents.heart}
          opacity={0.6 + Math.sin(i) * 0.4}
          style={{ 
            animation: `twinkle ${1.8 + i * 0.05}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      
      {/* Premium Support Text */}
      <text 
        x="150" 
        y="240" 
        textAnchor="middle" 
        fontSize="16" 
        fontWeight="bold" 
        fill={illustrationColors.accents.heart}
      >
        Expert Care Team 👨‍⚕️
      </text>
      
      <text 
        x="150" 
        y="260" 
        textAnchor="middle" 
        fontSize="12" 
        fill={illustrationColors.petFur.brown}
      >
        Personal veterinary and care specialists at your service
      </text>
    </svg>
  </IllustrationContainer>
);

export default {
  PremiumUpgradeInvitation,
  AdvancedHealthMonitoring,
  PremiumSupport,
};