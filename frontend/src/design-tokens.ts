/** Neo-Brutalist Design Tokens for PS-05 Enterprise Intelligence Platform */

export const Colors = {
  /** Primary black background */
  black: '#000000',
  /** Secondary/surface black */
  charcoal: '#0A0A0A',
  /** Card/element background */
  card: '#111111',
  /** Primary white text */
  white: '#FFFFFF',
  /** Secondary text/muted */
  muted: '#A3A3A3',
  /** Border color */
  border: '#FFFFFF',
  /** Accent: Lime */
  lime: '#C6FF00',
  /** Accent: Pink */
  pink: '#FF4D8D',
  /** Accent: Yellow */
  yellow: '#FFD600',
  /** Subtle backgrounds (used sparingly) */
  surfaceLight: '#1A1A1A',
  surfaceMedium: '#222222',
} as const

export const Shadows = {
  /** Neo-brutalist hard shadow - offset right/down by 6px */
  card: '6px 6px 0px #FFFFFF',
  button: '5px 5px 0px #FFFFFF',
  input: '4px 4px 0px #FFFFFF',
  small: '2px 2px 0px #FFFFFF',
  inset: 'inset 2px 2px 0px #FFFFFF',
  buttonHover: '2px 2px 0px #FFFFFF',
  cardHover: '2px 2px 0px #FFFFFF',
} as const

export const BorderWidth = {
  default: '2px',
  button: '2px',
  input: '2px',
} as const

export const Radius = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  card: '6px',
  button: '8px',
  pill: '100px',
} as const

export const FontSizes = {
  xs: ['11px', { lineHeight: '14px' }],
  sm: ['12px', { lineHeight: '16px' }],
  md: ['14px', { lineHeight: '20px' }],
  lg: ['16px', { lineHeight: '24px' }],
  xl: ['20px', { lineHeight: '28px' }],
  '2xl': ['24px', { lineHeight: '32px' }],
  '3xl': ['30px', { lineHeight: '40px' }],
  '4xl': ['36px', { lineHeight: '44px' }],
  '5xl': ['48px', { lineHeight: '60px' }],
  '6xl': ['64px', { lineHeight: '72px' }],
} as const

export const ZIndex = {
  base: 1,
  overlay: 10,
  modal: 50,
  dropdown: 100,
} as const