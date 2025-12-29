/**
 * Custom Pet Icons
 * Brand-styled SVG icons for pet species selection
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const DogIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Dog face outline */}
    <circle cx="12" cy="12" r="9" />
    {/* Ears */}
    <path d="M6 4.5C5 3 3.5 3 3 4c-.5 1 0 3 1 4" />
    <path d="M18 4.5C19 3 20.5 3 21 4c.5 1 0 3-1 4" />
    {/* Eyes */}
    <circle cx="9" cy="10" r="1.5" fill="currentColor" />
    <circle cx="15" cy="10" r="1.5" fill="currentColor" />
    {/* Nose */}
    <ellipse cx="12" cy="14" rx="2" ry="1.5" fill="currentColor" />
    {/* Mouth */}
    <path d="M12 15.5v1.5" />
    <path d="M10 17.5c.5.5 1.5.5 2 0 .5.5 1.5.5 2 0" />
  </svg>
);

export const CatIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Cat face */}
    <path d="M12 21c-4.97 0-9-3.58-9-8 0-2.5 1.5-5 3-6l2-4 2 3h4l2-3 2 4c1.5 1 3 3.5 3 6 0 4.42-4.03 8-9 8z" />
    {/* Eyes */}
    <ellipse cx="9" cy="11" rx="1.5" ry="2" fill="currentColor" />
    <ellipse cx="15" cy="11" rx="1.5" ry="2" fill="currentColor" />
    {/* Nose */}
    <path d="M12 14.5l-1 1h2l-1-1z" fill="currentColor" />
    {/* Whiskers */}
    <path d="M6 13h-3" />
    <path d="M6 15h-2.5" />
    <path d="M18 13h3" />
    <path d="M18 15h2.5" />
    {/* Mouth */}
    <path d="M10.5 17c.5.5 1.5.5 2 0 .5.5 1.5.5 1.5 0" />
  </svg>
);

export const BirdIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Bird body */}
    <path d="M16 7c2-2 4-2 5-1s1.5 3 0 5c-1 1.5-3 2-4 2" />
    <ellipse cx="11" cy="12" rx="6" ry="5" />
    {/* Head */}
    <circle cx="16" cy="8" r="3" />
    {/* Eye */}
    <circle cx="17" cy="7.5" r="1" fill="currentColor" />
    {/* Beak */}
    <path d="M19 8l3-1-3 2" fill="currentColor" />
    {/* Wing */}
    <path d="M8 10c1-1 2-1 3 0s2 2 2 3" />
    <path d="M9 11c.5-.5 1.5-.5 2 .5s1 1.5 1 2" />
    {/* Tail feathers */}
    <path d="M5 12l-2 2" />
    <path d="M5 14l-3 1" />
    <path d="M5 13l-2.5 0" />
    {/* Legs */}
    <path d="M10 17v3l-1 1" />
    <path d="M10 20l1 1" />
    <path d="M13 17v3l-1 1" />
    <path d="M13 20l1 1" />
  </svg>
);

export const OtherPetIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Paw print - matches TailTracker logo style */}
    {/* Main pad */}
    <ellipse cx="12" cy="14" rx="4" ry="3.5" fill="currentColor" />
    {/* Toe pads */}
    <ellipse cx="7" cy="8" rx="2" ry="2.5" fill="currentColor" />
    <ellipse cx="17" cy="8" rx="2" ry="2.5" fill="currentColor" />
    <ellipse cx="9" cy="5" rx="1.5" ry="2" fill="currentColor" />
    <ellipse cx="15" cy="5" rx="1.5" ry="2" fill="currentColor" />
  </svg>
);

// Export a map for easy access
export const PetIcons = {
  dog: DogIcon,
  cat: CatIcon,
  bird: BirdIcon,
  other: OtherPetIcon,
};

export default PetIcons;
