import { NextRequest } from 'next/server';
import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { callLLMJSON, getDefaultConfig } from '@/lib/llm/client';
import type { Slide, SlideObject } from '@/lib/slide/types';

function ndjson(d: any): string { return JSON.stringify(d) + '\n'; }

interface AnalysisResult {
  imageWidth: number;
  imageHeight: number;
  backgroundColor: string;
  shapes: Array<{ type: string; shapeType: string; x: number; y: number; width: number; height: number; fill: string }>;
  texts: Array<{ type: string; text: string; x: number; y: number; width: number; height: number; fontSize: number; bold: boolean; color: string; align: string; confidence: number }>;
  icons: Array<{ type: string; x: number; y: number; width: number; height: number; iconName: string; iconColor: string }>;
}

export async function POST(request: NextRequest) {
  try {
    let image: File | null = null;
    let text: string | null = null;
    const ct = request.headers.get('content-type') || '';

    if (ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      image = fd.get('image') as File | null;
    } else {
      const j = await request.json();
      text = j.text || null;
    }

    if (!image && !text)
      return new Response(ndjson({ error: 'Image or text required' }), { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } });

    if (image) {
      const ab = await image.arrayBuffer();
      const imgPath = `/tmp/slide_studio_${Date.now()}.png`;
      writeFileSync(imgPath, Buffer.from(ab));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // 100% LOCAL: OpenCV shapes + EasyOCR text + OpenCV icons
            controller.enqueue(encoder.encode(ndjson({ step: '🔍 A analisar shapes (OpenCV)...' })));
            controller.enqueue(encoder.encode(ndjson({ step: '📝 A extrair texto (EasyOCR)...' })));

            const scriptPath = `${process.cwd()}/scripts/slide-analyzer-full.py`;
            const output = execSync(`/usr/bin/python3 ${scriptPath} ${imgPath} 2>/dev/null`, {
              timeout: 60000,
              maxBuffer: 20 * 1024 * 1024,
            }).toString();

            try { unlinkSync(imgPath); } catch {}

            const result: AnalysisResult = JSON.parse(output);
            const { imageWidth: imgW, imageHeight: imgH, backgroundColor: bgColor, shapes, texts, icons } = result;

            controller.enqueue(encoder.encode(ndjson({ step: '🔗 A combinar elementos...' })));

            // Convert ALL coordinates from pixels to 1280×720 canvas
            const scaleX = 1280 / imgW;
            const scaleY = 720 / imgH;
            const objects: SlideObject[] = [];

            // Shapes (bottom layer)
            for (const s of shapes) {
              objects.push({
                id: `shape_${objects.length}`,
                type: 'shape',
                x: Math.round(s.x * scaleX),
                y: Math.round(s.y * scaleY),
                width: Math.round(s.width * scaleX),
                height: Math.round(s.height * scaleY),
                rotation: 0,
                fill: s.fill,
                shapeType: s.shapeType === 'roundRect' ? 'rounded-rect' : s.shapeType === 'ellipse' ? 'circle' : 'rect',
              });
            }

            // Icons (middle layer)
            for (const ic of icons) {
              objects.push({
                id: `icon_${objects.length}`,
                type: 'icon',
                x: Math.round(ic.x * scaleX),
                y: Math.round(ic.y * scaleY),
                width: Math.round(ic.width * scaleX),
                height: Math.round(ic.height * scaleY),
                rotation: 0,
                iconName: ic.iconName,
                iconColor: ic.iconColor,
                iconSize: Math.round(Math.min(ic.width, ic.height) * Math.min(scaleX, scaleY)),
              });
            }

            // Texts (top layer)
            for (const t of texts) {
              objects.push({
                id: `text_${objects.length}`,
                type: 'text',
                x: Math.round(t.x * scaleX),
                y: Math.round(t.y * scaleY),
                width: Math.round(t.width * scaleX),
                height: Math.round(t.height * scaleY),
                rotation: 0,
                text: t.text,
                fontSize: Math.round(t.fontSize * Math.min(scaleX, scaleY)),
                fontFamily: 'Calibri',
                fontWeight: t.bold ? 'bold' : 'normal',
                textAlign: (t.align as 'left' | 'center' | 'right') || 'left',
                fontColor: t.color || '#000000',
              });
            }

            const slide: Slide = { objects, width: 1280, height: 720, backgroundColor: bgColor };

            controller.enqueue(encoder.encode(ndjson({ step: `✅ ${objects.length} objetos (${shapes.length} shapes, ${texts.length} textos, ${icons.length} icons)` })));
            controller.enqueue(encoder.encode(ndjson({ slide, auditReport: { matched: [], offset: [], missing: [] }, iterationCount: 1 })));
          } catch (err: any) {
            controller.enqueue(encoder.encode(ndjson({ error: err.message || 'Analysis failed' })));
          } finally { controller.close(); }
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } });
    }

    // Text mode (DeepSeek)
    const slide = await callLLMJSON<Slide>(getDefaultConfig(), {
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON with key "objects". Each: {id,type:"text",x(0-1280),y(0-720),width,height,rotation:0,text,fontSize,fontFamily,fontWeight,textAlign,fontColor}' },
        { role: 'user', content: text! },
      ],
      temperature: 0.2, maxTokens: 8192,
    });
    return new Response(ndjson({ slide, auditReport: { matched: [], offset: [], missing: [] }, iterationCount: 1 }), {
      headers: { 'Content-Type': 'application/x-ndjson' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(ndjson({ error: `Analysis failed: ${msg}` }), { status: 500, headers: { 'Content-Type': 'application/x-ndjson' } });
  }
}
