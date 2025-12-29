/**
 * TailTracker Logo Component
 * Reusable logo with configurable size and text visibility
 */

import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  linkTo?: string;
}

const sizeMap = {
  sm: 'w-10 h-10',      // 40px - header navigation
  md: 'w-12 h-12',      // 48px - sidebar logo
  lg: 'w-16 h-16',      // 64px - auth pages
  xl: 'w-20 h-20',      // 80px - large displays
};

const textSizeMap = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export const Logo = ({
  size = 'md',
  showText = true,
  className = '',
  linkTo = '/'
}: LogoProps) => {
  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/images/pets/Logo.png"
        alt="TailTracker"
        className={`${sizeMap[size]} object-contain`}
      />
      {showText && (
        <span className={`font-bold text-slate-900 ${textSizeMap[size]}`}>
          TailTracker
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
