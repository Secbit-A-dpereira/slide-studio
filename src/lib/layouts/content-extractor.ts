import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import type { SlideObject } from '../slide/types';

export interface SlideReplica {
  objects: SlideObject[];
  slides?: Array<{
    elements: SlideObject[];
    background?: string;
  }>;
  pptxJson: string; // JSON array of element descriptors, 1:1 with PptxGenJS calls
}

function pxToInches(val: number, maxPx: number, maxInches: number): number {
  return Math.round((val / maxPx) * maxInches * 100) / 100;
}

const PROMPT = `You are a slide replication engine. Analyze the slide screenshot and output EXACT coordinates in a 10×5.625 inch space (16:9 slide).

For EVERY visible element, return an object with one of these types:

TEXT elements:
{"type":"text","x":number(inches),"y":number,"width":number,"height":number,"text":"EXACT verbatim text","fontSize":number(points),"fontColor":"#hex","bold":boolean,"italic":boolean,"textAlign":"left|center|right","rotation":0}

SHAPE elements (rectangles, cards, banners, lines, circles):
{"type":"shape","x":number,"y":number,"width":number,"height":number,"fill":"#hex|null","shapeType":"rect|roundRect|ellipse|line","rotation":0}

ICON elements (small graphics, NOT text):
{"type":"icon","x":number,"y":number,"width":number,"height":number,"iconName":"PascalCase Lucide name (e.g. Folder, Shield, Users, Cpu, Zap, Building2, Headphones, Network, Lock, Globe, Check, ArrowRight)","iconColor":"#hex","rotation":0}

CRITICAL RULES:
- Coordinates in INCHES. Slide is 10" wide × 5.625" tall.
- Text must be EXACT verbatim.
- Font sizes in POINTS (title=28-44pt, body=14-18pt).
- Icons are NOT text. If you see a small graphic/icon, use type:"icon" with a Lucide name. Do NOT put icon names as text.
- Include ALL elements: every text, every shape/card, every icon.
- Return ONLY the JSON array, nothing else.

Example:
[
  {"type":"text","x":0.5,"y":0.3,"width":9,"height":0.7,"text":"Slide Title","fontSize":36,"fontColor":"#FFFFFF","bold":true,"textAlign":"center"},
  {"type":"shape","x":0.3,"y":1.2,"width":9.4,"height":0.05,"fill":"#3B82F6","shapeType":"rect"},
  {"type":"icon","x":0.5,"y":1.8,"width":0.3,"height":0.3,"iconName":"Shield","iconColor":"#E63946"}
]`;

export async function extractSlideElements(imgPath: string): Promise<SlideReplica> {
  const prompt = `Read the slide screenshot at ${imgPath}.\n${PROMPT}\n\nReplicate this slide precisely.`;
  const promptPath = `/tmp/agy_prompt_${Date.now()}.txt`;
  writeFileSync(promptPath, prompt);

  const cmd = `cat ${promptPath} | ~/.local/bin/agy -p --model "Gemini 3.5 Flash (Medium)" --dangerously-skip-permissions --print-timeout 5m 2>&1`;
  const output = execSync(cmd, { timeout: 360000, maxBuffer: 50 * 1024 * 1024 }).toString();

  try { unlinkSync(promptPath); } catch {}

  // Extract JSON array from output
  const jsonMatch = output.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found in Gemini output');

  let cleaned = jsonMatch[0]
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
    .trim();

  const rawElements: any[] = JSON.parse(cleaned);
  
  // Convert to SlideObject format (1280x720 for fabric.js canvas)
  const objects: SlideObject[] = rawElements.map((el: any, i: number) => {
    // Detect icons: Gemini sometimes returns them as text with icon-like names
    const iconKeywords = ['folder', 'shield', 'search', 'settings', 'user', 'users', 'home', 
      'building', 'check', 'arrow', 'chevron', 'mail', 'phone', 'lock', 'unlock', 'eye',
      'star', 'heart', 'bell', 'calendar', 'clock', 'download', 'upload', 'trash',
      'edit', 'plus', 'minus', 'x', 'menu', 'filter', 'sort', 'refresh', 'save',
      'globe', 'wifi', 'battery', 'cpu', 'database', 'server', 'cloud', 'lock',
      'key', 'fingerprint', 'scan', 'activity', 'trending', 'dollar', 'euro',
      'zap', 'bolt', 'fire', 'target', 'award', 'book', 'briefcase', 'camera',
      'code', 'compass', 'crosshair', 'fast-forward', 'flag', 'gift', 'globe',
      'headphones', 'image', 'inbox', 'layers', 'layout', 'life-buoy', 'map',
      'message', 'mic', 'monitor', 'moon', 'mouse', 'navigation', 'package',
      'paperclip', 'pause', 'play', 'printer', 'radio', 'repeat', 'rewind',
      'rocket', 'rss', 'shield', 'shopping-bag', 'shopping-cart', 'shuffle',
      'sidebar', 'slider', 'smartphone', 'speaker', 'square', 'star', 'sun',
      'sunrise', 'sunset', 'tablet', 'tag', 'thumbs-down', 'thumbs-up',
      'ticket', 'timer', 'toggle', 'tool', 'umbrella', 'undo', 'video', 'voicemail',
      'volume', 'watch', 'waves', 'wind', 'wrench', 'zoom-in', 'zoom-out'];
    
    const textLower = (el.text || '').toLowerCase().trim();
    const isIconName = el.type === 'icon' || (el.type === 'text' && iconKeywords.some(k => textLower === k || textLower.startsWith(k)));
    
    if (isIconName) {
      return {
        id: `obj_${i}`,
        type: 'icon' as const,
        x: Math.round(el.x * 128),
        y: Math.round(el.y * 128),
        width: Math.round(el.width * 128),
        height: Math.round(el.height * 128),
        rotation: el.rotation || 0,
        iconName: el.iconName || el.text || 'Circle',
        iconColor: el.fontColor || el.fill || '#000000',
        iconSize: el.fontSize ? Math.round(el.fontSize * 128 / 72) : 32,
      };
    }
    
    return {
      id: `obj_${i}`,
      type: el.type === 'image' ? 'image' as const : el.type === 'shape' ? 'shape' as const : 'text' as const,
      x: Math.round(el.x * 128),
      y: Math.round(el.y * 128),
      width: Math.round(el.width * 128),
      height: Math.round(el.height * 128),
      rotation: el.rotation || 0,
      text: el.text || undefined,
      fontSize: el.fontSize || undefined,
      fontFamily: el.fontFamily || 'Calibri',
      fontWeight: el.bold ? 'bold' as const : 'normal' as const,
      fontStyle: el.italic ? 'italic' as const : undefined,
      textAlign: el.textAlign || 'left',
      fontColor: el.fontColor || '#000000',
      fill: el.fill || undefined,
      shapeType: el.shapeType || undefined,
      opacity: el.opacity,
    };
  });

  return {
    objects,
    pptxJson: JSON.stringify(rawElements),
  };
}
