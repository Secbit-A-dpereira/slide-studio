export interface DesignSystem {
  brand: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textMuted: string;
    cardBg: string;
    cardBorder: string;
    success: string;
    warning: string;
    error: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    slidePadding: number;
    elementGap: number;
  };
  slide: {
    width: number;
    height: number;
  };
  rules: string[];
}

export const VODAFONE: DesignSystem = {
  brand: 'Vodafone',
  colors: {
    primary: '#E60000',
    secondary: '#333333',
    accent: '#E60000',
    background: '#FFFFFF',
    text: '#1A1A1A',
    textMuted: '#666666',
    cardBg: '#F5F5F5',
    cardBorder: '#E0E0E0',
    success: '#00A859',
    warning: '#FFB800',
    error: '#E60000',
  },
  fonts: {
    heading: 'Calibri',
    body: 'Calibri',
    mono: 'Consolas',
  },
  spacing: {
    slidePadding: 80,
    elementGap: 20,
  },
  slide: {
    width: 1280,
    height: 720,
  },
  rules: [
    'Use Vodafone red (#E60000) only for accents, headings, and key highlights — never as a background fill.',
    'Keep backgrounds white (#FFFFFF) or light gray (#F5F5F5).',
    'Use Calibri for all text. Bold for headings, regular for body.',
    'Maintain plenty of white space — Vodafone designs are clean and uncluttered.',
    'Do not use gradients or decorative effects.',
  ],
};

export const DARK_CORPORATE: DesignSystem = {
  brand: 'Dark Corporate',
  colors: {
    primary: '#1E293B',
    secondary: '#334155',
    accent: '#3B82F6',
    background: '#0F172A',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    cardBg: '#1E293B',
    cardBorder: '#334155',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  fonts: {
    heading: 'Calibri',
    body: 'Calibri',
    mono: 'Consolas',
  },
  spacing: {
    slidePadding: 80,
    elementGap: 20,
  },
  slide: {
    width: 1280,
    height: 720,
  },
  rules: [
    'Use dark backgrounds (#0F172A navy/dark-slate).',
    'Accent with blue (#3B82F6) for highlights and interactive elements.',
    'White text (#F8FAFC) on dark backgrounds, muted gray (#94A3B8) for secondary text.',
    'Cards use slightly lighter dark (#1E293B) with subtle borders (#334155).',
    'Minimal, clean, data-focused aesthetic.',
  ],
};

export const DESIGN_SYSTEMS: Record<string, DesignSystem> = {
  vodafone: VODAFONE,
  'dark-corporate': DARK_CORPORATE,
};

export function getDesignSystem(name?: string): DesignSystem | null {
  if (!name || name === 'none') return null;
  return DESIGN_SYSTEMS[name] || null;
}
