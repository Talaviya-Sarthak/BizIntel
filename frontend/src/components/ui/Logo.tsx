import React from 'react';
import { clsx } from 'clsx';

export type LogoTheme = 'dark' | 'light' | 'brand' | 'emerald' | 'mono' | 'auto';
export type LogoVariant = 'full' | 'mark' | 'text';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: LogoSize | number;
  theme?: LogoTheme;
  className?: string;
  glow?: boolean;
}

export interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  theme?: LogoTheme;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showBadge?: boolean;
  badgeText?: string;
  glow?: boolean;
}

/**
 * Color palettes for the 14 isometric facets of the BizIntel 3D loop mark.
 */
const FACET_THEMES = {
  // Rich Forest / Brand Green (faithful to brand identity, optimized for dark & light)
  brand: {
    stroke: 'rgba(255, 255, 255, 0.3)',
    strokeWidth: '0.8',
    facets: [
      '#2d5215', // 1. Top Wing
      '#24440f', // 2. Top Mid Left
      '#325a19', // 3. Top Mid Right
      '#38641c', // 4. Top Outer Left
      '#437722', // 5. Top Inner Left
      '#39661d', // 6. Top Inner Right
      '#22400d', // 7. Top Outer Right
      '#284912', // 8. Bottom Outer Left
      '#437722', // 9. Bottom Inner Left
      '#39661d', // 10. Bottom Inner Right
      '#1e370a', // 11. Bottom Outer Right
      '#2a4d13', // 12. Bottom Mid Left
      '#335c1a', // 13. Bottom Mid Right
      '#22400d', // 14. Bottom Wing
    ],
  },
  // Vivid Emerald Green (optimized for high-contrast dark enterprise UI)
  dark: {
    stroke: 'rgba(255, 255, 255, 0.32)',
    strokeWidth: '0.8',
    facets: [
      '#2f5c18', // 1. Top Wing
      '#264d12', // 2. Top Mid Left
      '#376c1e', // 3. Top Mid Right
      '#3e7a22', // 4. Top Outer Left
      '#4b942a', // 5. Top Inner Left
      '#3f7f23', // 6. Top Inner Right
      '#23470e', // 7. Top Outer Right
      '#2a5515', // 8. Bottom Outer Left
      '#4b942a', // 9. Bottom Inner Left
      '#3f7f23', // 10. Bottom Inner Right
      '#1e3d0c', // 11. Bottom Outer Right
      '#2c5916', // 12. Bottom Mid Left
      '#386e1f', // 13. Bottom Mid Right
      '#23470e', // 14. Bottom Wing
    ],
  },
  // High-Tech Emerald Mode
  emerald: {
    stroke: 'rgba(255, 255, 255, 0.35)',
    strokeWidth: '0.8',
    facets: [
      '#059669', // 1
      '#047857', // 2
      '#10b981', // 3
      '#0d9488', // 4
      '#34d399', // 5
      '#10b981', // 6
      '#065f46', // 7
      '#047857', // 8
      '#34d399', // 9
      '#10b981', // 10
      '#064e3b', // 11
      '#059669', // 12
      '#0d9488', // 13
      '#065f46', // 14
    ],
  },
  // Light Background Mode (Deep olive-forest brand tones)
  light: {
    stroke: 'rgba(255, 255, 255, 0.45)',
    strokeWidth: '0.8',
    facets: [
      '#24440c',
      '#1c3808',
      '#2b5010',
      '#325c13',
      '#3d7017',
      '#335e13',
      '#1a3306',
      '#213f09',
      '#3d7017',
      '#335e13',
      '#162a05',
      '#23460a',
      '#2c520f',
      '#1a3306',
    ],
  },
  // Monochrome / White Outline Mode
  mono: {
    stroke: 'rgba(255, 255, 255, 0.4)',
    strokeWidth: '0.8',
    facets: [
      'rgba(255, 255, 255, 0.25)',
      'rgba(255, 255, 255, 0.18)',
      'rgba(255, 255, 255, 0.32)',
      'rgba(255, 255, 255, 0.38)',
      'rgba(255, 255, 255, 0.48)',
      'rgba(255, 255, 255, 0.35)',
      'rgba(255, 255, 255, 0.15)',
      'rgba(255, 255, 255, 0.22)',
      'rgba(255, 255, 255, 0.48)',
      'rgba(255, 255, 255, 0.35)',
      'rgba(255, 255, 255, 0.12)',
      'rgba(255, 255, 255, 0.24)',
      'rgba(255, 255, 255, 0.30)',
      'rgba(255, 255, 255, 0.15)',
    ],
  },
};

const SIZE_MAP: Record<LogoSize, { mark: string; text: string; gap: string; container: string }> = {
  xs: { mark: 'h-5 w-5', text: 'text-xs font-semibold', gap: 'gap-1.5', container: 'h-6' },
  sm: { mark: 'h-6 w-6', text: 'text-sm font-semibold', gap: 'gap-2', container: 'h-7' },
  md: { mark: 'h-8 w-8', text: 'text-base font-bold', gap: 'gap-2.5', container: 'h-9' },
  lg: { mark: 'h-10 w-10', text: 'text-xl font-bold', gap: 'gap-3', container: 'h-11' },
  xl: { mark: 'h-14 w-14', text: 'text-2xl font-extrabold', gap: 'gap-3.5', container: 'h-16' },
};

/**
 * Standalone Logo Mark component (the 3D isometric triangular origami loop)
 */
export function LogoMark({
  size = 'md',
  theme = 'dark',
  className,
  glow = false,
  ...props
}: LogoMarkProps) {
  const selectedTheme = theme === 'auto' ? 'dark' : (FACET_THEMES[theme] ? theme : 'dark');
  const palette = FACET_THEMES[selectedTheme];

  const sizeClass = typeof size === 'string' ? SIZE_MAP[size]?.mark || 'h-8 w-8' : undefined;
  const dimension = typeof size === 'number' ? size : undefined;

  return (
    <span className={clsx('relative inline-flex items-center justify-center shrink-0', className)}>
      {glow && (
        <span
          className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md pointer-events-none transform scale-125"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={clsx('shrink-0 transition-transform duration-200 group-hover:scale-105', sizeClass)}
        width={dimension}
        height={dimension}
        {...props}
      >
        {/* 1. Top Wing / Flag */}
        <polygon points="33,10 64,28 33,46" fill={palette.facets[0]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 2. Top Mid Left */}
        <polygon points="33,46 64,28 64,46" fill={palette.facets[1]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 3. Top Mid Right */}
        <polygon points="64,28 95,46 64,46" fill={palette.facets[2]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 4. Top Outer Left */}
        <polygon points="33,46 2,64 33,64" fill={palette.facets[3]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 5. Top Inner Left */}
        <polygon points="33,46 64,46 33,64" fill={palette.facets[4]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 6. Top Inner Right */}
        <polygon points="64,46 95,46 95,64" fill={palette.facets[5]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 7. Top Outer Right */}
        <polygon points="95,46 126,64 95,64" fill={palette.facets[6]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 8. Bottom Outer Left */}
        <polygon points="33,82 2,64 33,64" fill={palette.facets[7]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 9. Bottom Inner Left */}
        <polygon points="33,82 64,82 33,64" fill={palette.facets[8]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 10. Bottom Inner Right */}
        <polygon points="64,82 95,82 95,64" fill={palette.facets[9]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 11. Bottom Outer Right */}
        <polygon points="95,82 126,64 95,64" fill={palette.facets[10]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 12. Bottom Mid Left */}
        <polygon points="33,82 64,100 64,82" fill={palette.facets[11]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 13. Bottom Mid Right */}
        <polygon points="64,100 95,82 64,82" fill={palette.facets[12]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
        
        {/* 14. Bottom Wing / Flag */}
        <polygon points="95,118 64,100 95,82" fill={palette.facets[13]} stroke={palette.stroke} strokeWidth={palette.strokeWidth} strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * Standalone Logo Typography component ("BizIntel")
 */
export function LogoText({
  size = 'md',
  theme = 'dark',
  className,
}: {
  size?: LogoSize;
  theme?: LogoTheme;
  className?: string;
}) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const isLight = theme === 'light';

  return (
    <span
      className={clsx(
        'inline-flex items-center tracking-tight select-none font-sans leading-none',
        sizeConfig.text,
        className
      )}
    >
      <span className={isLight ? 'text-zinc-900' : 'text-white'}>Biz</span>
      <span
        className={
          isLight
            ? 'text-[#284907] font-bold'
            : 'text-emerald-400 font-bold drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]'
        }
      >
        Intel
      </span>
    </span>
  );
}

/**
 * Primary Brand Logo component (Icon Mark + Typography)
 */
export function Logo({
  variant = 'full',
  size = 'md',
  theme = 'dark',
  className,
  markClassName,
  textClassName,
  showBadge = false,
  badgeText = 'Enterprise',
  glow = false,
}: LogoProps) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  if (variant === 'mark') {
    return <LogoMark size={size} theme={theme} className={className} glow={glow} />;
  }

  if (variant === 'text') {
    return <LogoText size={size} theme={theme} className={className} />;
  }

  return (
    <span
      className={clsx(
        'group inline-flex items-center select-none shrink-0 transition-opacity hover:opacity-95',
        sizeConfig.gap,
        className
      )}
    >
      <LogoMark
        size={size}
        theme={theme}
        glow={glow}
        className={clsx('shrink-0', markClassName)}
      />
      <div className="flex items-center gap-2">
        <LogoText size={size} theme={theme} className={textClassName} />
        {showBadge && (
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
            {badgeText}
          </span>
        )}
      </div>
    </span>
  );
}

export default Logo;
