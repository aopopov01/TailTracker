/**
 * TailTracker Brand Illustrations
 * 
 * These illustrations define TailTracker's visual brand identity across all touchpoints.
 * They establish emotional connection, trust, and the special bond between pets and
 * their families while maintaining consistent brand recognition.
 * 
 * BRAND ILLUSTRATION PRINCIPLES:
 * - Instantly recognizable TailTracker identity
 * - Emotional warmth that connects with pet parents
 * - Scalable from app icons to marketing materials
 * - Consistent color palette and visual language
 * - Conveys expertise, care, and modern technology
 */

import React from 'react';
import { illustrationColors, IllustrationContainer } from '../IllustrationSystem';

// ====================================
// APP ICON FAMILY
// ====================================

/**
 * Primary App Icon
 * The main TailTracker app icon that appears on device home screens
 */
export const PrimaryAppIcon: React.FC<{ size?: number }> = ({ size = 120 }) => (
  <div style={{ width: size, height: size }}>
    <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
      {/* App Icon Background */}
      <defs>
        <radialGradient id="app-icon-bg" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="60%" stopColor={illustrationColors.accents.star} />
          <stop offset="100%" stopColor={illustrationColors.petFur.golden} />
        </radialGradient>
        
        <filter id="icon-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Icon Background */}
      <rect width="120" height="120" rx="24" fill="url(#app-icon-bg)" filter="url(#icon-shadow)" />
      
      {/* Central Pet Character */}
      <g transform="translate(60, 60)">
        {/* Pet Body */}
        <ellipse cx="0" cy="15" rx="20" ry="15" fill={illustrationColors.petFur.golden} />
        <circle cx="0" cy="-5" r="18" fill={illustrationColors.petFur.golden} />
        
        {/* Friendly Ears */}
        <ellipse cx="-12" cy="-15" rx="5" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(-20)" />
        <ellipse cx="12" cy="-15" rx="5" ry="10" fill={illustrationColors.petFur.brown} transform="rotate(20)" />
        
        {/* Loving Eyes */}
        <circle cx="-6" cy="-8" r="4" fill={illustrationColors.eyes.warm} />
        <circle cx="6" cy="-8" r="4" fill={illustrationColors.eyes.warm} />
        <circle cx="-5" cy="-10" r="1.5" fill="white" />
        <circle cx="7" cy="-10" r="1.5" fill="white" />
        
        {/* Happy Nose */}
        <ellipse cx="0" cy="-2" rx="2" ry="1.5" fill="#1F2937" />
        
        {/* Joyful Smile */}
        <path d="M -4 2 Q 0 6 4 2" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Wagging Tail */}
        <path 
          d="M 18 10 Q 25 5 22 -5" 
          stroke={illustrationColors.petFur.golden} 
          strokeWidth="4" 
          fill="none"
          strokeLinecap="round"
        />
        
        {/* TailTracker Logo Element */}
        <circle cx="22" cy="0" r="6" fill="white" opacity="0.9" />
        <path d="M 19 0 L 21 -2 L 25 2 L 23 4 Z" fill={illustrationColors.accents.star} />
      </g>
      
      {/* Brand Sparkle */}
      <circle cx="25" cy="25" r="3" fill="white" opacity="0.8" />
      <circle cx="95" cy="30" r="2" fill="white" opacity="0.6" />
      <circle cx="30" cy="90" r="2.5" fill="white" opacity="0.7" />
    </svg>
  </div>
);

/**
 * Monochrome App Icon
 * For use in contexts requiring single-color icons
 */
export const MonochromeAppIcon: React.FC<{ size?: number; color?: string }> = ({ 
  size = 120, 
  color = illustrationColors.petFur.golden 
}) => (
  <div style={{ width: size, height: size }}>
    <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
      {/* Monochrome Background */}
      <rect width="120" height="120" rx="24" fill={color} />
      
      {/* Simplified Pet Silhouette */}
      <g transform="translate(60, 60)" fill="white">
        <ellipse cx="0" cy="15" rx="20" ry="15" />
        <circle cx="0" cy="-5" r="18" />
        <ellipse cx="-12" cy="-15" rx="5" ry="10" transform="rotate(-20)" />
        <ellipse cx="12" cy="-15" rx="5" ry="10" transform="rotate(20)" />
        <path d="M 18 10 Q 25 5 22 -5" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      
      {/* Simple Brand Mark */}
      <circle cx="85" cy="35" r="4" fill="white" />
    </svg>
  </div>
);

// ====================================
// SPLASH SCREEN ARTWORK
// ====================================

/**
 * Animated Splash Screen
 * Welcome screen that greets users when app launches
 */
export const SplashScreen: React.FC = () => (
  <IllustrationContainer size="hero" mood="happy" animated>
    <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%' }}>
      {/* Splash Background */}
      <defs>
        <radialGradient id="splash-bg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
          <stop offset="40%" stopColor={illustrationColors.accents.star} stopOpacity="0.6" />
          <stop offset="80%" stopColor={illustrationColors.environments.home} stopOpacity="0.4" />
          <stop offset="100%" stopColor={illustrationColors.petFur.golden} stopOpacity="0.2" />
        </radialGradient>
        
        <filter id="splash-glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="200" cy="200" r="180" fill="url(#splash-bg)" />
      
      {/* Hero Pet Family */}
      <g style={{ animation: 'gentle-float 3s ease-in-out infinite alternate' }}>
        {/* Main Pet - Center Stage */}
        <g transform="translate(200, 200)">
          <ellipse cx="0" cy="25" rx="30" ry="22" fill={illustrationColors.petFur.golden} filter="url(#splash-glow)" />
          <circle cx="0" cy="-10" r="25" fill={illustrationColors.petFur.golden} filter="url(#splash-glow)" />
          
          {/* Majestic Ears */}
          <ellipse cx="-18" cy="-25" rx="7" ry="15" fill={illustrationColors.petFur.brown} transform="rotate(-15)" />
          <ellipse cx="18" cy="-25" rx="7" ry="15" fill={illustrationColors.petFur.brown} transform="rotate(15)" />
          
          {/* Sparkling Eyes */}
          <circle cx="-8" cy="-15" r="6" fill={illustrationColors.eyes.warm} />
          <circle cx="8" cy="-15" r="6" fill={illustrationColors.eyes.warm} />
          <circle cx="-6" cy="-18" r="2.5" fill="white" />
          <circle cx="10" cy="-18" r="2.5" fill="white" />
          
          {/* Star Pupils */}
          <path d="M -8 -15 L -7 -17 L -6 -15 L -4 -15 L -6 -14 L -5 -12 L -8 -13 L -11 -12 L -10 -14 L -12 -15 Z" fill="#FDE047" />
          <path d="M 8 -15 L 9 -17 L 10 -15 L 12 -15 L 10 -14 L 11 -12 L 8 -13 L 5 -12 L 6 -14 L 4 -15 Z" fill="#FDE047" />
          
          {/* Joyful Expression */}
          <ellipse cx="0" cy="-5" rx="3" ry="2" fill="#1F2937" />
          <path d="M -6 0 Q 0 6 6 0" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="0" cy="2" rx="2" ry="1.5" fill="#F87171" />
          
          {/* Celebrating Tail */}
          <path 
            d="M 30 20 Q 45 10 40 -10" 
            stroke={illustrationColors.petFur.golden} 
            strokeWidth="6" 
            fill="none"
            strokeLinecap="round"
            filter="url(#splash-glow)"
            style={{
              transformOrigin: '30px 20px',
              animation: 'tail-wag 1.5s ease-in-out infinite'
            }}
          />
        </g>
        
        {/* Supporting Pet Characters */}
        <g style={{ animation: 'gentle-float 4s ease-in-out infinite alternate reverse' }}>
          {/* Cat Friend */}
          <g transform="translate(120, 280)">
            <ellipse cx="0" cy="15" rx="18" ry="12" fill={illustrationColors.petFur.gray} />
            <circle cx="0" cy="0" r="15" fill={illustrationColors.petFur.gray} />
            <polygon points="-10,-10 -5,-20 0,-10" fill={illustrationColors.petFur.gray} />
            <polygon points="0,-10 5,-20 10,-10" fill={illustrationColors.petFur.gray} />
            <ellipse cx="-5" cy="-3" rx="3" ry="4" fill={illustrationColors.eyes.gentle} />
            <ellipse cx="5" cy="-3" rx="3" ry="4" fill={illustrationColors.eyes.gentle} />
          </g>
          
          {/* Bird Friend */}
          <g transform="translate(280, 120)">
            <ellipse cx="0" cy="5" rx="12" ry="8" fill={illustrationColors.petFur.orange} />
            <circle cx="-3" cy="-2" r="8" fill={illustrationColors.petFur.orange} />
            <path d="M 5 -2 Q 12 -5 10 2" fill={illustrationColors.petFur.orange} />
            <circle cx="-6" cy="-5" r="2" fill={illustrationColors.eyes.bright} />
          </g>
        </g>
      </g>
      
      {/* TailTracker Brand Name */}
      <g style={{ animation: 'heart-beat 4s ease-in-out infinite' }}>
        <text 
          x="200" 
          y="100" 
          textAnchor="middle" 
          fontSize="36" 
          fontWeight="bold" 
          fill="white"
          filter="url(#splash-glow)"
        >
          TailTracker
        </text>
        
        <text 
          x="200" 
          y="120" 
          textAnchor="middle" 
          fontSize="14" 
          fill="white"
          opacity="0.9"
        >
          Every pet deserves love and care
        </text>
      </g>
      
      {/* Magical Sparkles */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        const x = 200 + (120 + i * 3) * Math.cos((angle * Math.PI) / 180);
        const y = 200 + (120 + i * 3) * Math.sin((angle * Math.PI) / 180);
        
        return (
          <circle 
            key={i}
            cx={x} 
            cy={y} 
            r={2 + Math.sin(i) * 1} 
            fill="white"
            opacity={0.6 + Math.cos(i) * 0.4}
            style={{ 
              animation: `twinkle ${1.5 + i * 0.05}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        );
      })}
    </svg>
  </IllustrationContainer>
);

// ====================================
// MARKETING ILLUSTRATIONS
// ====================================

/**
 * App Store Hero Image
 * Primary marketing image for app store listings
 */
export const AppStoreHero: React.FC = () => (
  <IllustrationContainer size="hero" mood="premium" animated>
    <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
      {/* Marketing Background */}
      <defs>
        <linearGradient id="marketing-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="30%" stopColor={illustrationColors.accents.star} />
          <stop offset="70%" stopColor={illustrationColors.environments.home} />
          <stop offset="100%" stopColor={illustrationColors.petFur.golden} />
        </linearGradient>
      </defs>
      
      <rect width="400" height="300" fill="url(#marketing-bg)" />
      
      {/* Feature Showcase */}
      <g style={{ animation: 'gentle-float 4s ease-in-out infinite alternate' }}>
        {/* Central Pet with Phone */}
        <g transform="translate(200, 150)">
          {/* Happy Pet */}
          <ellipse cx="0" cy="20" rx="35" ry="25" fill={illustrationColors.petFur.golden} />
          <circle cx="0" cy="-15" r="30" fill={illustrationColors.petFur.golden} />
          
          {/* Excited Ears */}
          <ellipse cx="-20" cy="-30" rx="8" ry="18" fill={illustrationColors.petFur.brown} transform="rotate(-10)" />
          <ellipse cx="20" cy="-30" rx="8" ry="18" fill={illustrationColors.petFur.brown} transform="rotate(10)" />
          
          {/* Tech-Savvy Eyes */}
          <circle cx="-10" cy="-20" r="7" fill={illustrationColors.eyes.warm} />
          <circle cx="10" cy="-20" r="7" fill={illustrationColors.eyes.warm} />
          <circle cx="-8" cy="-23" r="3" fill="white" />
          <circle cx="12" cy="-23" r="3" fill="white" />
          
          {/* Phone Screen Reflection in Eyes */}
          <rect x="-9" y="-22" width="2" height="3" fill="#FDE047" />
          <rect x="11" y="-22" width="2" height="3" fill="#FDE047" />
          
          {/* Amazed Expression */}
          <ellipse cx="0" cy="-10" rx="3" ry="2" fill="#1F2937" />
          <path d="M -8 -5 Q 0 2 8 -5" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
          
          {/* Enthusiastic Tail */}
          <path 
            d="M 35 15 Q 55 5 50 -15" 
            stroke={illustrationColors.petFur.golden} 
            strokeWidth="7" 
            fill="none"
            strokeLinecap="round"
            style={{
              transformOrigin: '35px 15px',
              animation: 'tail-wag 1s ease-in-out infinite'
            }}
          />
        </g>
        
        {/* Phone Interface */}
        <g transform="translate(320, 150)">
          <rect x="-25" y="-50" width="50" height="100" rx="12" fill="white" />
          <rect x="-20" y="-45" width="40" height="90" rx="8" fill={illustrationColors.environments.home} />
          
          {/* App Interface Preview */}
          <circle cx="0" cy="-20" r="15" fill={illustrationColors.petFur.golden} />
          <circle cx="-6" cy="-25" r="2" fill={illustrationColors.eyes.warm} />
          <circle cx="6" cy="-25" r="2" fill={illustrationColors.eyes.warm} />
          <path d="M -4 -15 Q 0 -12 4 -15" stroke="#1F2937" strokeWidth="1" fill="none" />
          
          {/* Health Metrics */}
          <rect x="-15" y="0" width="30" height="2" rx="1" fill={illustrationColors.states.happy} />
          <rect x="-15" y="5" width="25" height="2" rx="1" fill={illustrationColors.accents.star} />
          <rect x="-15" y="10" width="20" height="2" rx="1" fill={illustrationColors.accents.sparkle} />
        </g>
      </g>
      
      {/* Feature Callouts */}
      <g style={{ animation: 'twinkle 3s ease-in-out infinite alternate' }}>
        {/* Health Tracking */}
        <circle cx="80" cy="80" r="20" fill="white" opacity="0.9" />
        <text x="80" y="85" textAnchor="middle" fontSize="16" fill={illustrationColors.states.happy}>🏥</text>
        
        {/* Location Safety */}
        <circle cx="320" cy="80" r="20" fill="white" opacity="0.9" />
        <text x="320" y="85" textAnchor="middle" fontSize="16" fill={illustrationColors.states.alert}>📍</text>
        
        {/* Photo Memories */}
        <circle cx="80" cy="220" r="20" fill="white" opacity="0.9" />
        <text x="80" y="225" textAnchor="middle" fontSize="16" fill={illustrationColors.accents.heart}>📸</text>
        
        {/* Community */}
        <circle cx="320" cy="220" r="20" fill="white" opacity="0.9" />
        <text x="320" y="225" textAnchor="middle" fontSize="16" fill={illustrationColors.accents.sparkle}>👥</text>
      </g>
      
      {/* Marketing Tagline */}
      <text 
        x="200" 
        y="50" 
        textAnchor="middle" 
        fontSize="24" 
        fontWeight="bold" 
        fill="white"
      >
        Love. Track. Care.
      </text>
      
      <text 
        x="200" 
        y="275" 
        textAnchor="middle" 
        fontSize="16" 
        fill="white"
        opacity="0.9"
      >
        The most caring pet app ever created
      </text>
    </svg>
  </IllustrationContainer>
);

export default {
  PrimaryAppIcon,
  MonochromeAppIcon,
  SplashScreen,
  AppStoreHero,
};