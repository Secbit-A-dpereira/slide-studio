import { callLLMJSON, getVisionConfig } from '@/lib/llm/client';
import type { LayoutType } from './definitions';
import { getDesignSystem, type DesignSystem } from './design-systems';

export interface ClassifiedSlide {
  layoutType: LayoutType;
  content: any;
  bgColor: string;
  accentColor: string;
}

function buildClassifyPrompt(ds?: DesignSystem | null): string {
  const brandSection = ds ? `
BRAND IDENTITY (${ds.brand}):
Colors:
- Primary: ${ds.colors.primary}
- Accent: ${ds.colors.accent}
- Background: ${ds.colors.background}
- Text: ${ds.colors.text}
- Text muted: ${ds.colors.textMuted}
Fonts:
- Heading: ${ds.fonts.heading}
- Body: ${ds.fonts.body}

Brand rules:
${ds.rules.map(r => `- ${r}`).join('\n')}

Apply these brand colors EXACTLY when setting "bgColor", "accentColor", and any color fields in the extracted content.
` : '';

  return `You are a slide layout classifier and content extractor.

STEP 1 — Classify the layout type (pick exactly ONE):${brandSection}

1. "cover-slide": A full-width title/hero slide — large centered title, optional subtitle, optional tag/label above title.
   Content schema: { "title": string, "subtitle"?: string, "tag"?: string, "bgColor": string, "accentColor": string }

2. "title-bullets": Main title + optional subtitle + list of bullet points.
   Content schema: { "title": string, "subtitle"?: string, "bullets": string[], "bgColor": string }

3. "header-columns": Header + optional subtitle + 2-4 columns each with a label and items.
   Content schema: { "title": string, "subtitle"?: string, "columns": Array<{label: string, items: string[], iconName?: string}>, "bgColor": string, "accentColor": string }

4. "two-column": Title + two side-by-side columns, each with header and items.
   Content schema: { "title": string, "leftCol": {header: string, items: string[]}, "rightCol": {header: string, items: string[]}, "bgColor": string }

5. "section-header": Section divider with large title, optional subtitle, accent color bar.
   Content schema: { "title": string, "subtitle"?: string, "bgColor": string, "accentColor": string }

6. "dashboard-card": Metrics/dashboard slide with title, label, and metric cards (name + value + optional icon).
   Content schema: { "title": string, "label": string, "columns": Array<{name: string, value: string, icon?: string}>, "bgColor": string, "accentColor": string }

7. "comparison-table": Side-by-side comparison of two or more items. Has a title, column headers for each item, and rows of feature comparisons.
   Content schema: { "title": string, "headers": string[], "rows": Array<{feature: string, values: string[]}>, "bgColor": string, "accentColor": string }

8. "numbered-steps": A process/step-by-step slide with numbered steps in sequence.
   Content schema: { "title": string, "steps": Array<{number: number, title: string, description: string}>, "bgColor": string, "accentColor": string }

9. "quote-slide": A large quote/ testimonial with attribution and optional background.
   Content schema: { "quote": string, "author": string, "role"?: string, "bgColor": string, "accentColor": string }

10. "image-gallery": A grid of images/cards with captions or labels.
    Content schema: { "title": string, "items": Array<{label: string, caption?: string}>, "bgColor": string, "accentColor": string }

11. "timeline": A horizontal or vertical timeline with milestone events in chronological order.
    Content schema: { "title": string, "events": Array<{year?: string, title: string, description: string}>, "bgColor": string, "accentColor": string }

STEP 2 — Extract content matching the layout schema above.

RULES:
- Text must be EXACT verbatim — every character, every line break, every punctuation.
- bgColor = the most dominant background color on the slide as EXACT hex.
- accentColor = the highlight/accent color as EXACT hex.
- If a brand identity is specified above, use the brand's EXACT color hex values.
- If the slide doesn't clearly match any layout, pick the CLOSEST match.
- Return ONLY valid JSON. No markdown, no explanations, no thinking tags.

OUTPUT FORMAT:
{
  "layoutType": "cover-slide" | "title-bullets" | "header-columns" | "two-column" | "section-header" | "dashboard-card" | "comparison-table" | "numbered-steps" | "quote-slide" | "image-gallery" | "timeline",
  "content": { ... matching the selected layout's schema ... }
}`;
}

export async function classifySlideLayout(
  imageBase64: string,
  designSystemName?: string
): Promise<ClassifiedSlide> {
  const config = getVisionConfig();
  const ds = designSystemName ? getDesignSystem(designSystemName) : null;

  const result = await callLLMJSON<{ layoutType: string; content: any }>(config, {
    messages: [
      {
        role: 'system',
        content: buildClassifyPrompt(ds),
      },
      {
        role: 'user',
        content: [
          {
            type: 'text' as const,
            text: ds
              ? `Classify this slide layout and extract content using the ${ds.brand} brand identity.`
              : 'Classify this slide layout and extract the content.',
          },
          {
            type: 'image_url' as const,
            image_url: { url: `data:image/png;base64,${imageBase64}` },
          },
        ],
      },
    ],
    temperature: 0.1,
    maxTokens: 8192,
  });

  const validLayouts: LayoutType[] = [
    'cover-slide',
    'title-bullets',
    'header-columns',
    'two-column',
    'section-header',
    'dashboard-card',
    'comparison-table',
    'numbered-steps',
    'quote-slide',
    'image-gallery',
    'timeline',
  ];

  const layoutType = validLayouts.includes(result.layoutType as LayoutType)
    ? (result.layoutType as LayoutType)
    : 'title-bullets';

  const content = result.content || {};
  const bgColor = content.bgColor || '#FFFFFF';
  const accentColor = content.accentColor || '#2563EB';

  return { layoutType, content, bgColor, accentColor };
}
