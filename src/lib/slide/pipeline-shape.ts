import { callLLMJSON, getVisionConfig } from '@/lib/llm/client';
import type { SlideObject } from './types';

const SHAPE_PIPELINE_SYSTEM_PROMPT = `You are an expert slide shape extractor. Analyze this slide screenshot and extract ONLY the shape elements (rectangles, rounded rectangles, circles, lines, arrows).

COORDINATE SYSTEM:
- Use a normalized coordinate system of 1000x1000, where (0,0) is top-left and (1000,1000) is bottom-right.
- All 'x', 'y', 'width', and 'height' properties must be integers between 0 and 1000.
- Map shape positions precisely to this grid.

SHAPE EXTRACTION RULES:
- Identify shapes like background container cards, headers, borders, separator lines.
- Set shapeType to one of: 'rect', 'circle', 'rounded-rect', 'line', 'arrow'.
- Estimate fill (hex color code or null if empty/transparent), stroke (hex color code or null), and strokeWidth.
- Set type to "shape" for all elements. Do NOT extract text, icons, or images.

Return ONLY valid JSON matching this schema:
{
  "objects": [
    {
      "id": string (unique ID, e.g., "shape_1", "shape_2"),
      "type": "shape",
      "x": number (0-1000),
      "y": number (0-1000),
      "width": number (0-1000),
      "height": number (0-1000),
      "rotation": number (usually 0),
      "fill": string (hex color code) | null,
      "stroke": string (hex color code) | null,
      "strokeWidth": number | null,
      "shapeType": "rect" | "circle" | "rounded-rect" | "line" | "arrow"
    }
  ],
  "backgroundColor": string (slide background hex color)
}`;

export interface ShapePipelineResult {
  objects: SlideObject[];
  backgroundColor?: string;
}

export async function runShapePipeline(imageUrl: string): Promise<ShapePipelineResult> {
  const config = getVisionConfig();
  
  try {
    const response = await callLLMJSON<ShapePipelineResult>(config, {
      messages: [
        {
          role: 'system',
          content: SHAPE_PIPELINE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ONLY shape elements from this slide screenshot. Focus on cards, containers, lines, and colors.',
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
    
    return {
      objects: (response.objects || []).map(obj => ({
        ...obj,
        type: 'shape' as const,
      })),
      backgroundColor: response.backgroundColor,
    };
  } catch (error) {
    console.error('Error running shape pipeline:', error);
    return { objects: [] };
  }
}
