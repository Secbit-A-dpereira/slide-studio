import { callLLMJSON, getVisionConfig } from '@/lib/llm/client';
import type { Slide, SlideObject } from './types';

export interface AuditReport {
  matched: string[];
  offset: string[];
  missing: Array<{
    description: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

const AUDITOR_SYSTEM_PROMPT = `You are an expert slide auditor. Compare the original slide screenshot with the reconstructed slide objects.

We have reconstructed the slide using AI. You need to verify if the reconstructed objects are in the right positions, if any are misaligned/offset, or if any elements from the original slide are missing.

Here is the JSON of the reconstructed slide objects (coordinates are scaled to a 1280x720 screen):
{RECONSTRUCTED_SLIDE_JSON}

Compare the original image with this list of objects:
1. "matched": Look at the coordinates and content. If the object in the list matches the original image's position and content within a reasonable margin, classify its ID as matched.
2. "offset": If an object exists in the reconstructed list but is in the wrong position, has the wrong size, wrong color, wrong text alignment, or overlaps other elements incorrectly, classify its ID as offset.
3. "missing": If there are any text elements, containers, shapes, or icons in the original screenshot that are NOT in the reconstructed list, describe them and estimate their coordinates on the 1280x720 scale.

Return ONLY a valid JSON object matching this schema:
{
  "matched": ["obj_id_1", "obj_id_2"],
  "offset": ["obj_id_3"],
  "missing": [
    {
      "description": "Short description of the missing element",
      "x": number (0-1280),
      "y": number (0-720),
      "width": number (0-1280),
      "height": number (0-720)
    }
  ]
}`;

export async function runAuditor(imageUrl: string, slide: Slide): Promise<AuditReport> {
  const config = getVisionConfig();
  
  // Format objects for the prompt to keep it compact
  const compactObjects = slide.objects.map(obj => {
    const res: any = {
      id: obj.id,
      type: obj.type,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
    };
    if (obj.type === 'text') res.text = obj.text;
    if (obj.type === 'shape') res.shapeType = obj.shapeType;
    if (obj.type === 'icon') res.iconName = obj.iconName;
    return res;
  });

  const prompt = AUDITOR_SYSTEM_PROMPT.replace(
    '{RECONSTRUCTED_SLIDE_JSON}',
    JSON.stringify({ objects: compactObjects, backgroundColor: slide.backgroundColor }, null, 2)
  );

  try {
    const report = await callLLMJSON<AuditReport>(config, {
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Compare the original slide image with the provided reconstructed object list and generate the validation report.',
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      temperature: 0.1,
      maxTokens: 4096,
    });

    return {
      matched: report.matched || [],
      offset: report.offset || [],
      missing: report.missing || [],
    };
  } catch (error) {
    console.error('Error running auditor:', error);
    return {
      matched: [],
      offset: [],
      missing: [],
    };
  }
}
