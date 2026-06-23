import PptxGenJS from 'pptxgenjs';
import type { SlideObject } from '@/lib/slide/types';
import {
  LayoutType,
  TitleBulletsContent,
  HeaderColumnsContent,
  TwoColumnContent,
  SectionHeaderContent,
  DashboardCardContent,
  CoverSlideContent,
  ComparisonTableContent,
  NumberedStepsContent,
  QuoteSlideContent,
  ImageGalleryContent,
  TimelineContent,
  getThemeColors,
} from './definitions';

const PX_TO_IN_X = 12 / 1280;
const PX_TO_IN_Y = 6.75 / 720;

function pxX(px: number): number { return px * PX_TO_IN_X; }
function pxY(px: number): number { return px * PX_TO_IN_Y; }

export function layoutToObjects(type: LayoutType, content: any): SlideObject[] {
  switch (type) {
    case 'title-bullets':
      return titleBulletsToObjects(content);
    case 'header-columns':
      return headerColumnsToObjects(content);
    case 'two-column':
      return twoColumnToObjects(content);
    case 'section-header':
      return sectionHeaderToObjects(content);
    case 'dashboard-card':
      return dashboardCardToObjects(content);
    case 'cover-slide':
      return coverSlideToObjects(content);
    case 'comparison-table':
      return comparisonTableToObjects(content);
    case 'numbered-steps':
      return numberedStepsToObjects(content);
    case 'quote-slide':
      return quoteSlideToObjects(content);
    case 'image-gallery':
      return imageGalleryToObjects(content);
    case 'timeline':
      return timelineToObjects(content);
    default:
      return [];
  }
}

function titleBulletsToObjects(content: TitleBulletsContent): SlideObject[] {
  const { title, subtitle, bullets, bgColor } = content;
  const theme = getThemeColors(bgColor);
  const objects: SlideObject[] = [];

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 80,
    y: 80,
    width: 1120,
    height: 60,
    rotation: 0,
    text: title,
    fontSize: 40,
    fontFamily: 'Calibri',
    fontWeight: 'bold',
    textAlign: 'left',
    fontColor: theme.textMain,
  });

  // Subtitle
  if (subtitle) {
    objects.push({
      id: 'subtitle',
      type: 'text',
      x: 80,
      y: 150,
      width: 1120,
      height: 40,
      rotation: 0,
      text: subtitle,
      fontSize: 22,
      fontFamily: 'Calibri',
      fontWeight: 'normal',
      textAlign: 'left',
      fontColor: theme.textMuted,
    });
  }

  // Bullets
  const startY = subtitle ? 230 : 190;
  bullets.forEach((bullet, idx) => {
    const y = startY + idx * 70;
    // Bullet icon (ChevronRight)
    objects.push({
      id: `bullet_icon_${idx}`,
      type: 'icon',
      x: 80,
      y: y + 8,
      width: 16,
      height: 16,
      rotation: 0,
      iconName: 'ChevronRight',
      iconColor: theme.accent,
      iconSize: 16,
      fill: theme.accent,
    });
    // Bullet text
    objects.push({
      id: `bullet_${idx}`,
      type: 'text',
      x: 110,
      y: y,
      width: 1090,
      height: 40,
      rotation: 0,
      text: bullet,
      fontSize: 22,
      fontFamily: 'Calibri',
      fontWeight: 'normal',
      textAlign: 'left',
      fontColor: theme.textMain,
    });
  });

  return objects;
}

function headerColumnsToObjects(content: HeaderColumnsContent): SlideObject[] {
  const { title, subtitle, columns, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 80,
    y: 60,
    width: 1120,
    height: 50,
    rotation: 0,
    text: title,
    fontSize: 32,
    fontFamily: 'Calibri',
    fontWeight: 'bold',
    textAlign: 'left',
    fontColor: theme.textMain,
  });

  // Subtitle
  if (subtitle) {
    objects.push({
      id: 'subtitle',
      type: 'text',
      x: 80,
      y: 115,
      width: 1120,
      height: 30,
      rotation: 0,
      text: subtitle,
      fontSize: 18,
      fontFamily: 'Calibri',
      fontWeight: 'normal',
      textAlign: 'left',
      fontColor: theme.textMuted,
    });
  }

  // Columns
  const numCols = columns.length;
  const gap = 35;
  const totalW = 1120;
  const colW = (totalW - (numCols - 1) * gap) / numCols;
  const colH = 460;
  const startY = 175;

  columns.forEach((col, i) => {
    const colX = 80 + i * (colW + gap);

    // Column background card
    objects.push({
      id: `col_bg_${i}`,
      type: 'shape',
      shapeType: 'rounded-rect',
      x: colX,
      y: startY,
      width: colW,
      height: colH,
      rotation: 0,
      fill: theme.cardBg,
      stroke: theme.cardBorder,
      strokeWidth: 1,
    });

    // Column icon (if present)
    const hasIcon = !!col.iconName;
    if (col.iconName) {
      objects.push({
        id: `col_icon_${i}`,
        type: 'icon',
        x: colX + 20,
        y: startY + 20,
        width: 28,
        height: 28,
        rotation: 0,
        iconName: col.iconName,
        iconColor: theme.accent,
        iconSize: 28,
        fill: theme.accent,
      });
    }

    // Column label
    objects.push({
      id: `col_label_${i}`,
      type: 'text',
      x: colX + 20 + (hasIcon ? 36 : 0),
      y: startY + 20,
      width: colW - 40 - (hasIcon ? 36 : 0),
      height: 30,
      rotation: 0,
      text: col.label,
      fontSize: 18,
      fontFamily: 'Calibri',
      fontWeight: 'bold',
      textAlign: 'left',
      fontColor: theme.accent,
    });

    // Column items
    col.items.forEach((item, j) => {
      const itemY = startY + 70 + j * 45;
      objects.push({
        id: `col_${i}_item_bullet_${j}`,
        type: 'text',
        x: colX + 20,
        y: itemY,
        width: 15,
        height: 35,
        rotation: 0,
        text: '•',
        fontSize: 16,
        fontFamily: 'Calibri',
        fontWeight: 'bold',
        textAlign: 'left',
        fontColor: theme.accent,
      });

      objects.push({
        id: `col_${i}_item_${j}`,
        type: 'text',
        x: colX + 35,
        y: itemY,
        width: colW - 55,
        height: 35,
        rotation: 0,
        text: item,
        fontSize: 15,
        fontFamily: 'Calibri',
        fontWeight: 'normal',
        textAlign: 'left',
        fontColor: theme.textMain,
      });
    });
  });

  return objects;
}

function twoColumnToObjects(content: TwoColumnContent): SlideObject[] {
  const { title, leftCol, rightCol, bgColor } = content;
  const theme = getThemeColors(bgColor);
  const objects: SlideObject[] = [];

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 80,
    y: 70,
    width: 1120,
    height: 50,
    rotation: 0,
    text: title,
    fontSize: 34,
    fontFamily: 'Calibri',
    fontWeight: 'bold',
    textAlign: 'left',
    fontColor: theme.textMain,
  });

  // Two columns
  const colW = 535;
  const colH = 460;
  const startY = 160;
  const leftX = 80;
  const rightX = 665;

  const cols = [
    { idPrefix: 'left', x: leftX, header: leftCol.header, items: leftCol.items },
    { idPrefix: 'right', x: rightX, header: rightCol.header, items: rightCol.items },
  ];

  cols.forEach(c => {
    // Column background card
    objects.push({
      id: `${c.idPrefix}_bg`,
      type: 'shape',
      shapeType: 'rounded-rect',
      x: c.x,
      y: startY,
      width: colW,
      height: colH,
      rotation: 0,
      fill: theme.cardBg,
      stroke: theme.cardBorder,
      strokeWidth: 1,
    });

    // Column Header
    objects.push({
      id: `${c.idPrefix}_header`,
      type: 'text',
      x: c.x + 30,
      y: startY + 25,
      width: colW - 60,
      height: 40,
      rotation: 0,
      text: c.header,
      fontSize: 22,
      fontFamily: 'Calibri',
      fontWeight: 'bold',
      textAlign: 'left',
      fontColor: theme.accent,
    });

    // Column items
    c.items.forEach((item, idx) => {
      const itemY = startY + 85 + idx * 55;

      objects.push({
        id: `${c.idPrefix}_item_bullet_${idx}`,
        type: 'text',
        x: c.x + 30,
        y: itemY,
        width: 15,
        height: 45,
        rotation: 0,
        text: '•',
        fontSize: 18,
        fontFamily: 'Calibri',
        fontWeight: 'bold',
        textAlign: 'left',
        fontColor: theme.accent,
      });

      objects.push({
        id: `${c.idPrefix}_item_${idx}`,
        type: 'text',
        x: c.x + 50,
        y: itemY,
        width: colW - 80,
        height: 45,
        rotation: 0,
        text: item,
        fontSize: 16,
        fontFamily: 'Calibri',
        fontWeight: 'normal',
        textAlign: 'left',
        fontColor: theme.textMain,
      });
    });
  });

  return objects;
}

function sectionHeaderToObjects(content: SectionHeaderContent): SlideObject[] {
  const { title, subtitle, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];

  // Accent bar on the left
  objects.push({
    id: 'accent_bar',
    type: 'shape',
    shapeType: 'rect',
    x: 120,
    y: 250,
    width: 12,
    height: 180,
    rotation: 0,
    fill: theme.accent,
  });

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 160,
    y: 240,
    width: 960,
    height: 110,
    rotation: 0,
    text: title,
    fontSize: 52,
    fontFamily: 'Calibri',
    fontWeight: 'bold',
    textAlign: 'left',
    fontColor: theme.isDark ? '#FFFFFF' : '#111827',
  });

  // Subtitle
  if (subtitle) {
    objects.push({
      id: 'subtitle',
      type: 'text',
      x: 160,
      y: 365,
      width: 960,
      height: 50,
      rotation: 0,
      text: subtitle,
      fontSize: 24,
      fontFamily: 'Calibri',
      fontWeight: 'normal',
      textAlign: 'left',
      fontColor: theme.textMuted,
    });
  }

  return objects;
}

function dashboardCardToObjects(content: DashboardCardContent): SlideObject[] {
  const { title, label, columns, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 80,
    y: 60,
    width: 1120,
    height: 50,
    rotation: 0,
    text: title,
    fontSize: 32,
    fontFamily: 'Calibri',
    fontWeight: 'bold',
    textAlign: 'left',
    fontColor: theme.textMain,
  });

  // Label
  if (label) {
    objects.push({
      id: 'label',
      type: 'text',
      x: 80,
      y: 115,
      width: 1120,
      height: 30,
      rotation: 0,
      text: label,
      fontSize: 18,
      fontFamily: 'Calibri',
      fontWeight: 'normal',
      textAlign: 'left',
      fontColor: theme.textMuted,
    });
  }

  // Metric Cards
  const numCards = columns.length;
  const gap = 30;
  const totalW = 1120;
  const cardW = (totalW - (numCards - 1) * gap) / numCards;
  const cardH = 430;
  const startY = 175;

  columns.forEach((card, i) => {
    const cardX = 80 + i * (cardW + gap);

    // Card background
    objects.push({
      id: `card_bg_${i}`,
      type: 'shape',
      shapeType: 'rounded-rect',
      x: cardX,
      y: startY,
      width: cardW,
      height: cardH,
      rotation: 0,
      fill: theme.cardBg,
      stroke: theme.accent,
      strokeWidth: 1.5,
    });

    // Card Icon (if present)
    if (card.icon) {
      objects.push({
        id: `card_icon_${i}`,
        type: 'icon',
        x: cardX + (cardW / 2) - 20,
        y: startY + 40,
        width: 40,
        height: 40,
        rotation: 0,
        iconName: card.icon,
        iconColor: theme.accent,
        iconSize: 40,
        fill: theme.accent,
      });
    }

    // Card Value
    objects.push({
      id: `card_value_${i}`,
      type: 'text',
      x: cardX + 20,
      y: startY + (card.icon ? 100 : 60),
      width: cardW - 40,
      height: 70,
      rotation: 0,
      text: card.value,
      fontSize: 44,
      fontFamily: 'Calibri',
      fontWeight: 'bold',
      textAlign: 'center',
      fontColor: theme.accent,
    });

    // Card Name
    objects.push({
      id: `card_name_${i}`,
      type: 'text',
      x: cardX + 20,
      y: startY + (card.icon ? 180 : 140),
      width: cardW - 40,
      height: 50,
      rotation: 0,
      text: card.name,
      fontSize: 18,
      fontFamily: 'Calibri',
      fontWeight: 'bold',
      textAlign: 'center',
      fontColor: theme.textMain,
    });
  });

  return objects;
}

// ─── New Layout Templates ───────────────────────────────────────────

function coverSlideToObjects(content: CoverSlideContent): SlideObject[] {
  const { title, subtitle, tag, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];

  // Tag label above title
  if (tag) {
    objects.push({
      id: 'tag_label',
      type: 'shape',
      shapeType: 'rounded-rect',
      x: 540, y: 220, width: 200, height: 36, rotation: 0,
      fill: theme.accent,
    });
    objects.push({
      id: 'tag_text',
      type: 'text',
      x: 540, y: 224, width: 200, height: 30, rotation: 0,
      text: tag, fontSize: 16, fontFamily: 'Calibri', fontWeight: 'bold',
      textAlign: 'center', fontColor: '#FFFFFF',
    });
  }

  // Title
  const titleY = tag ? 280 : 240;
  objects.push({
    id: 'title',
    type: 'text',
    x: 80, y: titleY, width: 1120, height: 80, rotation: 0,
    text: title, fontSize: 48, fontFamily: 'Calibri', fontWeight: 'bold',
    textAlign: 'center', fontColor: theme.textMain,
  });

  // Subtitle
  if (subtitle) {
    objects.push({
      id: 'subtitle',
      type: 'text',
      x: 160, y: titleY + 100, width: 960, height: 50, rotation: 0,
      text: subtitle, fontSize: 24, fontFamily: 'Calibri', fontWeight: 'normal',
      textAlign: 'center', fontColor: theme.textMuted,
    });
  }

  // Accent line at bottom
  objects.push({
    id: 'accent_line',
    type: 'shape',
    shapeType: 'rect',
    x: 540, y: 580, width: 200, height: 4, rotation: 0,
    fill: theme.accent,
  });

  return objects;
}

function comparisonTableToObjects(content: ComparisonTableContent): SlideObject[] {
  const { title, headers, rows, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];
  const numCols = headers.length;
  const colW = Math.min(220, (1100 - (numCols - 1) * 2) / numCols);

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 80, y: 50, width: 1120, height: 50, rotation: 0,
    text: title, fontSize: 32, fontFamily: 'Calibri', fontWeight: 'bold',
    textAlign: 'left', fontColor: theme.textMain,
  });

  // Table header bar
  objects.push({
    id: 'header_bar',
    type: 'shape',
    shapeType: 'rect',
    x: 80, y: 120, width: 1120, height: 40, rotation: 0,
    fill: theme.accent,
  });

  // Column headers
  headers.forEach((h, i) => {
    const x = i === 0 ? 90 : 90 + (i * (colW + 2));
    objects.push({
      id: `header_${i}`,
      type: 'text',
      x, y: 124, width: colW, height: 34, rotation: 0,
      text: h, fontSize: 16, fontFamily: 'Calibri', fontWeight: 'bold',
      textAlign: 'center', fontColor: '#FFFFFF',
    });
  });

  // Rows
  rows.forEach((row, ri) => {
    const rowY = 170 + ri * 50;
    const isAlt = ri % 2 === 1;

    if (isAlt) {
      objects.push({
        id: `row_bg_${ri}`,
        type: 'shape',
        shapeType: 'rect',
        x: 80, y: rowY - 4, width: 1120, height: 44, rotation: 0,
        fill: theme.cardBg, opacity: 0.5,
      });
    }

    row.values.forEach((val, vi) => {
      const x = vi === 0 ? 90 : 90 + (vi * (colW + 2));
      objects.push({
        id: `cell_${ri}_${vi}`,
        type: 'text',
        x, y: rowY, width: colW, height: 38, rotation: 0,
        text: val, fontSize: 14, fontFamily: 'Calibri',
        fontWeight: vi === 0 ? 'bold' : 'normal',
        textAlign: vi === 0 ? 'left' : 'center',
        fontColor: vi === 0 ? theme.accent : theme.textMain,
      });
    });
  });

  return objects;
}

function numberedStepsToObjects(content: NumberedStepsContent): SlideObject[] {
  const { title, steps, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];
  const numSteps = steps.length;
  const stepW = Math.min(300, (1100 - (numSteps - 1) * 20) / numSteps);
  const startX = 80 + (1120 - (numSteps * stepW + (numSteps - 1) * 20)) / 2;

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 80, y: 50, width: 1120, height: 50, rotation: 0,
    text: title, fontSize: 32, fontFamily: 'Calibri', fontWeight: 'bold',
    textAlign: 'center', fontColor: theme.textMain,
  });

  steps.forEach((step, i) => {
    const sx = startX + i * (stepW + 20);
    const sy = 140;

    // Step number circle
    objects.push({
      id: `step_circle_${i}`,
      type: 'shape',
      shapeType: 'circle',
      x: sx + stepW / 2 - 25, y: sy, width: 50, height: 50, rotation: 0,
      fill: theme.accent,
    });
    objects.push({
      id: `step_num_${i}`,
      type: 'text',
      x: sx + stepW / 2 - 25, y: sy + 6, width: 50, height: 38, rotation: 0,
      text: String(step.number), fontSize: 22, fontFamily: 'Calibri', fontWeight: 'bold',
      textAlign: 'center', fontColor: '#FFFFFF',
    });

    // Card background
    objects.push({
      id: `step_card_${i}`,
      type: 'shape',
      shapeType: 'rounded-rect',
      x: sx, y: sy + 70, width: stepW, height: 280, rotation: 0,
      fill: theme.cardBg, stroke: theme.cardBorder, strokeWidth: 1,
    });

    // Step title
    objects.push({
      id: `step_title_${i}`,
      type: 'text',
      x: sx + 15, y: sy + 85, width: stepW - 30, height: 30, rotation: 0,
      text: step.title, fontSize: 18, fontFamily: 'Calibri', fontWeight: 'bold',
      textAlign: 'center', fontColor: theme.textMain,
    });

    // Step description
    objects.push({
      id: `step_desc_${i}`,
      type: 'text',
      x: sx + 15, y: sy + 125, width: stepW - 30, height: 200, rotation: 0,
      text: step.description, fontSize: 14, fontFamily: 'Calibri', fontWeight: 'normal',
      textAlign: 'left', fontColor: theme.textMuted,
    });
  });

  return objects;
}

function quoteSlideToObjects(content: QuoteSlideContent): SlideObject[] {
  const { quote, author, role, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];

  // Large quote mark
  objects.push({
    id: 'quote_mark',
    type: 'text',
    x: 80, y: 80, width: 80, height: 100, rotation: 0,
    text: '"', fontSize: 96, fontFamily: 'Georgia', fontWeight: 'bold',
    textAlign: 'left', fontColor: theme.accent,
  });

  // Quote text
  objects.push({
    id: 'quote_text',
    type: 'text',
    x: 140, y: 120, width: 1000, height: 280, rotation: 0,
    text: quote, fontSize: 28, fontFamily: 'Georgia', fontWeight: 'normal',
    textAlign: 'left', fontColor: theme.textMain,
  });

  // Accent divider
  objects.push({
    id: 'quote_divider',
    type: 'shape',
    shapeType: 'rect',
    x: 140, y: 420, width: 60, height: 4, rotation: 0,
    fill: theme.accent,
  });

  // Author
  objects.push({
    id: 'quote_author',
    type: 'text',
    x: 140, y: 450, width: 600, height: 30, rotation: 0,
    text: author, fontSize: 20, fontFamily: 'Calibri', fontWeight: 'bold',
    textAlign: 'left', fontColor: theme.textMain,
  });

  // Role
  if (role) {
    objects.push({
      id: 'quote_role',
      type: 'text',
      x: 140, y: 485, width: 600, height: 24, rotation: 0,
      text: role, fontSize: 16, fontFamily: 'Calibri', fontWeight: 'normal',
      textAlign: 'left', fontColor: theme.textMuted,
    });
  }

  return objects;
}

function imageGalleryToObjects(content: ImageGalleryContent): SlideObject[] {
  const { title, items, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];
  const numItems = items.length;
  const cols = Math.min(3, Math.max(1, Math.ceil(numItems / 2)));
  const rows = Math.ceil(numItems / cols);
  const gap = 30;
  const availW = 1120;
  const cardW = (availW - (cols - 1) * gap) / cols;
  const cardH = Math.min(260, (500 - (rows - 1) * gap) / rows);

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 80, y: 50, width: 1120, height: 50, rotation: 0,
    text: title, fontSize: 32, fontFamily: 'Calibri', fontWeight: 'bold',
    textAlign: 'left', fontColor: theme.textMain,
  });

  items.forEach((item, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const cx = 80 + c * (cardW + gap);
    const cy = 130 + r * (cardH + gap);

    // Image placeholder card
    objects.push({
      id: `gallery_card_${idx}`,
      type: 'shape',
      shapeType: 'rounded-rect',
      x: cx, y: cy, width: cardW, height: cardH, rotation: 0,
      fill: theme.cardBg, stroke: theme.cardBorder, strokeWidth: 1,
    });

    // Placeholder image area
    objects.push({
      id: `gallery_img_${idx}`,
      type: 'shape',
      shapeType: 'rounded-rect',
      x: cx + 15, y: cy + 15, width: cardW - 30, height: cardH - 90, rotation: 0,
      fill: theme.cardBorder,
    });

    // Label
    objects.push({
      id: `gallery_label_${idx}`,
      type: 'text',
      x: cx + 15, y: cy + cardH - 65, width: cardW - 30, height: 30, rotation: 0,
      text: item.label, fontSize: 16, fontFamily: 'Calibri', fontWeight: 'bold',
      textAlign: 'center', fontColor: theme.textMain,
    });

    // Caption
    if (item.caption) {
      objects.push({
        id: `gallery_caption_${idx}`,
        type: 'text',
        x: cx + 15, y: cy + cardH - 35, width: cardW - 30, height: 24, rotation: 0,
        text: item.caption, fontSize: 12, fontFamily: 'Calibri', fontWeight: 'normal',
        textAlign: 'center', fontColor: theme.textMuted,
      });
    }
  });

  return objects;
}

function timelineToObjects(content: TimelineContent): SlideObject[] {
  const { title, events, bgColor, accentColor } = content;
  const theme = getThemeColors(bgColor, accentColor);
  const objects: SlideObject[] = [];

  // Title
  objects.push({
    id: 'title',
    type: 'text',
    x: 80, y: 40, width: 1120, height: 50, rotation: 0,
    text: title, fontSize: 32, fontFamily: 'Calibri', fontWeight: 'bold',
    textAlign: 'left', fontColor: theme.textMain,
  });

  // Timeline line
  const lineY = 150;
  const lineStartX = 120;
  const lineEndX = 1160;
  objects.push({
    id: 'timeline_line',
    type: 'shape',
    shapeType: 'rect',
    x: lineStartX, y: lineY, width: lineEndX - lineStartX, height: 4, rotation: 0,
    fill: theme.cardBorder,
  });

  events.forEach((evt, i) => {
    const spacing = (lineEndX - lineStartX) / Math.max(events.length - 1, 1);
    const ex = lineStartX + i * spacing - 15;

    // Circle node
    objects.push({
      id: `tl_node_${i}`,
      type: 'shape',
      shapeType: 'circle',
      x: ex + 6, y: lineY - 10, width: 24, height: 24, rotation: 0,
      fill: theme.accent,
    });

    // Year/label above
    const labelY = lineY - 80;
    if (evt.year) {
      objects.push({
        id: `tl_year_${i}`,
        type: 'text',
        x: ex - 40, y: labelY, width: 120, height: 24, rotation: 0,
        text: evt.year, fontSize: 14, fontFamily: 'Calibri', fontWeight: 'bold',
        textAlign: 'center', fontColor: theme.accent,
      });
    }

    // Title below
    objects.push({
      id: `tl_title_${i}`,
      type: 'text',
      x: ex - 50, y: lineY + 35, width: 140, height: 24, rotation: 0,
      text: evt.title, fontSize: 14, fontFamily: 'Calibri', fontWeight: 'bold',
      textAlign: 'center', fontColor: theme.textMain,
    });

    // Description below title
    if (evt.description) {
      objects.push({
        id: `tl_desc_${i}`,
        type: 'text',
        x: ex - 45, y: lineY + 60, width: 130, height: 40, rotation: 0,
        text: evt.description, fontSize: 11, fontFamily: 'Calibri', fontWeight: 'normal',
        textAlign: 'center', fontColor: theme.textMuted,
      });
    }
  });

  return objects;
}

// ─── End New Layout Templates ───────────────────────────────────────

export function reconstructContentFromObjects(
  layoutType: LayoutType,
  objects: SlideObject[],
  originalContent: any
): any {
  const content = JSON.parse(JSON.stringify(originalContent || {}));

  const getObjectText = (id: string, fallback: string = '') => {
    const obj = objects.find(o => o.id === id);
    return obj && obj.text !== undefined ? obj.text : fallback;
  };

  const getObjectIcon = (id: string, fallback: string = '') => {
    const obj = objects.find(o => o.id === id);
    return obj && obj.iconName !== undefined ? obj.iconName : fallback;
  };

  switch (layoutType) {
    case 'title-bullets':
      content.title = getObjectText('title', content.title);
      if (content.subtitle !== undefined || objects.some(o => o.id === 'subtitle')) {
        content.subtitle = getObjectText('subtitle', content.subtitle);
      }
      content.bullets = (content.bullets || []).map((b: string, i: number) => {
        return getObjectText(`bullet_${i}`, b);
      });
      break;

    case 'header-columns':
      content.title = getObjectText('title', content.title);
      if (content.subtitle !== undefined || objects.some(o => o.id === 'subtitle')) {
        content.subtitle = getObjectText('subtitle', content.subtitle);
      }
      content.columns = (content.columns || []).map((col: any, i: number) => {
        const items = (col.items || []).map((item: string, j: number) => {
          return getObjectText(`col_${i}_item_${j}`, item);
        });
        return {
          ...col,
          label: getObjectText(`col_label_${i}`, col.label),
          iconName: getObjectIcon(`col_icon_${i}`, col.iconName),
          items,
        };
      });
      break;

    case 'two-column':
      content.title = getObjectText('title', content.title);
      if (content.leftCol) {
        content.leftCol.header = getObjectText('left_header', content.leftCol.header);
        content.leftCol.items = (content.leftCol.items || []).map((item: string, j: number) => {
          return getObjectText(`left_item_${j}`, item);
        });
      }
      if (content.rightCol) {
        content.rightCol.header = getObjectText('right_header', content.rightCol.header);
        content.rightCol.items = (content.rightCol.items || []).map((item: string, j: number) => {
          return getObjectText(`right_item_${j}`, item);
        });
      }
      break;

    case 'section-header':
      content.title = getObjectText('title', content.title);
      if (content.subtitle !== undefined || objects.some(o => o.id === 'subtitle')) {
        content.subtitle = getObjectText('subtitle', content.subtitle);
      }
      break;

    case 'dashboard-card':
      content.title = getObjectText('title', content.title);
      content.label = getObjectText('label', content.label);
      content.columns = (content.columns || []).map((card: any, i: number) => {
        return {
          ...card,
          name: getObjectText(`card_name_${i}`, card.name),
          value: getObjectText(`card_value_${i}`, card.value),
          icon: getObjectIcon(`card_icon_${i}`, card.icon),
        };
      });
      break;

    case 'cover-slide':
      content.title = getObjectText('title', content.title);
      content.subtitle = getObjectText('subtitle', content.subtitle);
      content.tag = getObjectText('tag_text', content.tag);
      break;

    case 'comparison-table':
      content.title = getObjectText('title', content.title);
      content.headers = (content.headers || []).map((h: string, i: number) =>
        getObjectText(`header_${i}`, h)
      );
      content.rows = (content.rows || []).map((row: any, ri: number) => ({
        ...row,
        feature: getObjectText(`cell_${ri}_0`, row.feature),
        values: (row.values || []).map((v: string, vi: number) =>
          getObjectText(`cell_${ri}_${vi}`, v)
        ),
      }));
      break;

    case 'numbered-steps':
      content.title = getObjectText('title', content.title);
      content.steps = (content.steps || []).map((step: any, i: number) => ({
        ...step,
        title: getObjectText(`step_title_${i}`, step.title),
        description: getObjectText(`step_desc_${i}`, step.description),
      }));
      break;

    case 'quote-slide':
      content.quote = getObjectText('quote_text', content.quote);
      content.author = getObjectText('quote_author', content.author);
      content.role = getObjectText('quote_role', content.role);
      break;

    case 'image-gallery':
      content.title = getObjectText('title', content.title);
      content.items = (content.items || []).map((item: any, i: number) => ({
        ...item,
        label: getObjectText(`gallery_label_${i}`, item.label),
        caption: getObjectText(`gallery_caption_${i}`, item.caption),
      }));
      break;

    case 'timeline':
      content.title = getObjectText('title', content.title);
      content.events = (content.events || []).map((evt: any, i: number) => ({
        ...evt,
        title: getObjectText(`tl_title_${i}`, evt.title),
        description: getObjectText(`tl_desc_${i}`, evt.description),
      }));
      break;
  }

  return content;
}

function pptxAddShape(pptxSlide: any, type: string, opts: any) {
  pptxSlide.addShape(type, opts);
}

export const TEMPLATE_RENDERERS: Record<
  LayoutType,
  (pptx: PptxGenJS, content: any) => void
> = {
  'title-bullets': (pptx: PptxGenJS, content: TitleBulletsContent) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = titleBulletsToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'header-columns': (pptx: PptxGenJS, content: HeaderColumnsContent) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = headerColumnsToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'two-column': (pptx: PptxGenJS, content: TwoColumnContent) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = twoColumnToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'section-header': (pptx: PptxGenJS, content: SectionHeaderContent) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = sectionHeaderToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'dashboard-card': (pptx: PptxGenJS, content: DashboardCardContent) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = dashboardCardToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'cover-slide': (pptx, content) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = coverSlideToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'comparison-table': (pptx, content) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = comparisonTableToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'numbered-steps': (pptx, content) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = numberedStepsToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'quote-slide': (pptx, content) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = quoteSlideToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'image-gallery': (pptx, content) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = imageGalleryToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
  'timeline': (pptx, content) => {
    const slide = pptx.addSlide();
    slide.background = { fill: content.bgColor };
    const objects = timelineToObjects(content);
    renderObjectsToPptxSlide(slide, objects, pptx);
  },
};

function renderObjectsToPptxSlide(pptxSlide: any, objects: SlideObject[], pptx: PptxGenJS) {
  for (const obj of objects) {
    const x = pxX(obj.x);
    const y = pxY(obj.y);
    const w = pxX(obj.width);
    const h = pxY(obj.height);

    switch (obj.type) {
      case 'text':
        pptxSlide.addText(obj.text || '', {
          x,
          y,
          w,
          h,
          fontSize: obj.fontSize ? obj.fontSize * 0.75 : 16,
          fontFace: obj.fontFamily || 'Calibri',
          bold: obj.fontWeight === 'bold',
          align: (obj.textAlign as any) || 'left',
          color: (obj.fontColor || '#000000').replace('#', ''),
          valign: 'middle',
        });
        break;

      case 'shape': {
        const shapeTypeMap: Record<string, string> = {
          'rounded-rect': 'roundRect',
          rect: 'rect',
          circle: 'ellipse',
          line: 'line',
        };

        const pptxShapeType =
          pptx.ShapeType[
            (shapeTypeMap[obj.shapeType || 'rect'] || 'rect') as keyof typeof pptx.ShapeType
          ] || pptx.ShapeType.rect;

        pptxSlide.addShape(pptxShapeType, {
          x,
          y,
          w,
          h,
          fill: obj.fill ? { color: obj.fill.replace('#', '') } : undefined,
          line: obj.stroke
            ? { color: obj.stroke?.replace('#', ''), width: obj.strokeWidth || 1 }
            : undefined,
        });
        break;
      }

      case 'icon': {
        // Render a roundRect background card and overlays icon text name
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x,
          y,
          w,
          h,
          fill: obj.fill ? { color: obj.fill.replace('#', '') } : { color: 'E0E0E0' },
        });

        if (obj.iconName) {
          pptxSlide.addText(obj.iconName, {
            x,
            y,
            w,
            h,
            fontSize: (obj.iconSize || 24) * 0.5,
            align: 'center',
            valign: 'middle',
            color: obj.iconColor ? obj.iconColor.replace('#', '') : '666666',
          });
        }
        break;
      }
    }
  }
}
