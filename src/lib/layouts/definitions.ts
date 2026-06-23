export interface TitleBulletsContent {
  title: string;
  subtitle?: string;
  bullets: string[];
  bgColor: string;
}

export interface HeaderColumnsContent {
  title: string;
  subtitle: string;
  columns: Array<{
    label: string;
    items: string[];
    iconName?: string;
  }>;
  bgColor: string;
  accentColor: string;
}

export interface TwoColumnContent {
  title: string;
  leftCol: {
    header: string;
    items: string[];
  };
  rightCol: {
    header: string;
    items: string[];
  };
  bgColor: string;
}

export interface SectionHeaderContent {
  title: string;
  subtitle?: string;
  bgColor: string;
  accentColor: string;
}

export interface DashboardCardContent {
  title: string;
  label: string;
  columns: Array<{
    name: string;
    value: string;
    icon?: string;
  }>;
  bgColor: string;
  accentColor: string;
}

export interface CoverSlideContent {
  title: string;
  subtitle?: string;
  tag?: string;
  bgColor: string;
  accentColor: string;
}

export interface ComparisonTableContent {
  title: string;
  headers: string[];
  rows: Array<{
    feature: string;
    values: string[];
  }>;
  bgColor: string;
  accentColor: string;
}

export interface NumberedStepsContent {
  title: string;
  steps: Array<{
    number: number;
    title: string;
    description: string;
  }>;
  bgColor: string;
  accentColor: string;
}

export interface QuoteSlideContent {
  quote: string;
  author: string;
  role?: string;
  bgColor: string;
  accentColor: string;
}

export interface ImageGalleryContent {
  title: string;
  items: Array<{
    label: string;
    caption?: string;
  }>;
  bgColor: string;
  accentColor: string;
}

export interface TimelineContent {
  title: string;
  events: Array<{
    year?: string;
    title: string;
    description: string;
  }>;
  bgColor: string;
  accentColor: string;
}

export type LayoutType =
  | 'cover-slide'
  | 'title-bullets'
  | 'header-columns'
  | 'two-column'
  | 'section-header'
  | 'dashboard-card'
  | 'comparison-table'
  | 'numbered-steps'
  | 'quote-slide'
  | 'image-gallery'
  | 'timeline';

export function isDarkColor(hex: string): boolean {
  if (!hex) return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
}

export function getThemeColors(bgColor: string, accentColor?: string) {
  const isDark = isDarkColor(bgColor);
  return {
    isDark,
    textMain: isDark ? '#F8FAFC' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    cardBg: isDark ? '#1E293B' : '#FFFFFF',
    cardBorder: isDark ? '#334155' : '#E2E8F0',
    accent: accentColor || (isDark ? '#3B82F6' : '#2563EB'),
  };
}
