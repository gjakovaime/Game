// Color values are defined in src/styles/theme.css as CSS custom properties.
// Edit theme.css to retheme the app — changes propagate here automatically.
// NOTE: CSS var() references are resolved by React Native Web. If ever building
//       for iOS/Android, replace these with literal hex values.

export const Colors = {
  primary:        'var(--color-primary)',
  primaryDark:    'var(--color-primary-dark)',
  secondary:      'var(--color-secondary)',
  secondaryDark:  'var(--color-secondary-dark)',
  accent:         'var(--color-accent)',

  background:  'var(--color-background)',
  surface:     'var(--color-surface)',
  border:      'var(--color-border)',

  text:           'var(--color-text)',
  textLight:      'var(--color-text-light)',
  textOnPrimary:  'var(--color-text-on-primary)',

  success:       'var(--color-success)',
  successLight:  'var(--color-success-light)',
  error:         'var(--color-error)',
  errorLight:    'var(--color-error-light)',
  warning:       'var(--color-warning)',

  young:       'var(--color-young)',
  youngLight:  'var(--color-young-light)',
  older:       'var(--color-older)',
  olderLight:  'var(--color-older-light)',

  star:       'var(--color-star)',
  starEmpty:  'var(--color-star-empty)',
  avatarBg:   'var(--color-avatar-bg)',
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 34,
  huge: 48,
  emoji: 64,
};

export const Radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
