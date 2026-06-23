import { callLLMJSON, getVisionConfig } from '@/lib/llm/client';
import type { SlideObject } from './types';

const TEXT_PIPELINE_SYSTEM_PROMPT = `You are an expert slide text extractor. Analyze this slide screenshot and extract ONLY the text elements.

COORDINATE SYSTEM:
- Use a normalized coordinate system of 1000x1000, where (0,0) is top-left and (1000,1000) is bottom-right.
- All 'x', 'y', 'width', and 'height' properties must be integers between 0 and 1000.
- Map text positions precisely to this 1000x1000 grid. Align related texts (e.g. column headers and body text should share the exact same 'x' coordinate).

TEXT EXTRACTION RULES:
- Transcribe all text EXACTLY verbatim. Do NOT paraphrase, do NOT fix spelling, do NOT omit any text. Copy every symbol.
- Estimate font sizes on the 1000-height scale (e.g. 24 relative to a 1000-height slide).
- Identify font weight ('bold' or 'normal'), alignment ('left', 'center', 'right', 'justify'), and approximate fontColor (hex color code).
- Set type to "text" for all extracted elements. Do NOT extract shapes, icons, or images.

Return ONLY valid JSON matching this schema:
{
  "objects": [
    {
      "id": string (unique ID, e.g., "text_1", "text_2"),
      "type": "text",
      "x": number (0-1000),
      "y": number (0-1000),
      "width": number (0-1000),
      "height": number (0-1000),
      "rotation": number (usually 0),
      "text": string,
      "fontSize": number,
      "fontFamily": string,
      "fontWeight": "normal" | "bold",
      "textAlign": "left" | "center" | "right" | "justify",
      "fontColor": string (hex color code)
    }
  ]
}`;

export async function runTextPipeline(imageUrl: string): Promise<SlideObject[]> {
  const config = getVisionConfig();
  
  try {
    const response = await callLLMJSON<{ objects: SlideObject[] }>(config, {
      messages: [
        {
          role: 'system',
          content: TEXT_PIPELINE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ONLY text elements from this slide screenshot. Focus on verbatim content and alignment.',
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
      type: 'text' as const,
    }));
  } catch (error) {
    console.error('Error running text pipeline:', error);
    return [];
  }
}
