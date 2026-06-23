import { callLLMJSON, getVisionConfig } from '@/lib/llm/client';
import type { SlideObject } from './types';

const ICON_PIPELINE_SYSTEM_PROMPT = `You are an expert slide icon extractor. Analyze this slide screenshot and extract ONLY the graphic icons / symbols.

COORDINATE SYSTEM:
- Use a normalized coordinate system of 1000x1000, where (0,0) is top-left and (1000,1000) is bottom-right.
- All 'x', 'y', 'width', and 'height' properties must be integers between 0 and 1000.

ICON EXTRACTION RULES:
- Detect small graphic elements, icons, symbols.
- Map each icon to the closest Lucide React icon name (e.g., "Search", "Settings", "Check", "User", "Mail", "ChevronRight", "ArrowRight", "Globe", "Briefcase", "Shield", "Info", "Trash", "Plus", "Edit", "Download"). Use PascalCase.
- Estimate iconColor (hex color code) and iconSize.
- Set type to "icon" for all elements. Do NOT extract text, regular background shapes, or full images.

Return ONLY valid JSON matching this schema:
{
  "objects": [
    {
      "id": string (unique ID, e.g., "icon_1", "icon_2"),
      "type": "icon",
      "x": number (0-1000),
      "y": number (0-1000),
      "width": number (0-1000),
      "height": number (0-1000),
      "rotation": number (usually 0),
      "iconName": string (Lucide icon name),
      "iconColor": string (hex color code),
      "iconSize": number
    }
  ]
}`;

export async function runIconPipeline(imageUrl: string): Promise<SlideObject[]> {
  const config = getVisionConfig();
  
  try {
    const response = await callLLMJSON<{ objects: SlideObject[] }>(config, {
      messages: [
        {
          role: 'system',
          content: ICON_PIPELINE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ONLY small visual icon elements from this slide screenshot. Map them to Lucide icon names.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      temperature: 0.1,
      maxTokens: 8192,
    });
    
    return (response.objects || []).map(obj => ({
      ...obj,
      type: 'icon' as const,
    }));
  } catch (error) {
    console.error('Error running icon pipeline:', error);
    return [];
  }
}
