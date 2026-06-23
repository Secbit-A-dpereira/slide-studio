export type ObjectType = 'text' | 'image' | 'shape' | 'icon' | 'table';

export interface SlideObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontColor?: string;
  // Shape
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shapeType?: 'rect' | 'circle' | 'line' | 'arrow' | 'rounded-rect';
  opacity?: number;
  // Image
  src?: string; // base64 data URL
  alt?: string;
  // Icon
  iconName?: string;
  iconColor?: string;
  iconSize?: number;
  iconSrc?: string; // URL of real PNG from Flaticon CDN (for PPTX export)
}

export interface Slide {
  objects: SlideObject[];
  width: number;
  height: number;
  backgroundColor?: string;
  backgroundImage?: string; // base64 data URL — the full slide background
  layoutType?: string;
  layoutContent?: any;
}

export interface SlideEditRequest {
  object: SlideObject;
  prompt: string;
  allObjects: SlideObject[]; // context for the LLM
}

export interface AuditReport {
  matched: string[];
  offset: Array<{ id: string; reason: string }> | string[];
  missing: Array<{
    description: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }> | string[];
}

export interface LLMResponse {
  success: boolean;
  data?: SlideObject | Slide;
  error?: string;
  raw?: string;
}

export interface RegionChild {
  id?: string;
  type: 'text' | 'icon' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  // Text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontColor?: string;
  // Shape
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shapeType?: 'rect' | 'circle' | 'line' | 'arrow' | 'rounded-rect';
  opacity?: number;
  // Icon
  iconName?: string;
  iconColor?: string;
  iconSize?: number;
}

export interface Region {
  id?: string;
  type: 'card' | 'header' | 'column' | 'banner' | 'general';
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  children: RegionChild[];
}

export interface HierarchicalSlide {
  regions: Region[];
  backgroundColor: string;
}