'use client';

import { useEffect, useRef } from 'react';
import { Canvas, Rect, Ellipse, Textbox, FabricImage, type FabricObject } from 'fabric';
import type { Slide, SlideObject } from '@/lib/slide/types';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/lib/slide/defaults';

interface SlideCanvasProps {
  slide: Slide;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onObjectModified: (id: string, props: Partial<SlideObject>) => void;
  offsetObjectIds?: string[];
}

const CANVAS_W = 800;
const CANVAS_H = (CANVAS_W / 1280) * 720;
const SCALE = CANVAS_W / SLIDE_WIDTH;

interface FabricObjectWithId extends FabricObject {
  _objId?: string;
}

export function SlideCanvas({
  slide,
  selectedObjectId,
  onSelectObject,
  onObjectModified,
  offsetObjectIds = [],
}: SlideCanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const objectRefs = useRef<Map<string, FabricObjectWithId>>(new Map());
  const isUpdatingRef = useRef(false);
  // Track a hash of object IDs to detect structural changes (add/remove)
  const objectsHashRef = useRef('');

  // Init canvas once
  useEffect(() => {
    if (!canvasElRef.current || fabricRef.current) return;

    const c = new Canvas(canvasElRef.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: '#FFFFFF',
      selection: true,
      preserveObjectStacking: true,
    });

    const handleSelect = (e: any) => {
      if (isUpdatingRef.current) return;
      const obj = e.selected?.[0] as FabricObjectWithId | undefined;
      if (obj?._objId) onSelectObject(obj._objId);
    };

    c.on('selection:created', handleSelect);
    c.on('selection:updated', handleSelect);

    c.on('selection:cleared', () => {
      if (isUpdatingRef.current) return;
      onSelectObject(null);
    });

    c.on('object:modified', (e) => {
      if (isUpdatingRef.current) return;
      const obj = e.target as FabricObjectWithId | undefined;
      if (!obj?._objId) return;
      onObjectModified(obj._objId, {
        x: (obj.left ?? 0) / SCALE,
        y: (obj.top ?? 0) / SCALE,
        width: ((obj.width ?? 0) * (obj.scaleX ?? 1)) / SCALE,
        height: ((obj.height ?? 0) * (obj.scaleY ?? 1)) / SCALE,
        rotation: obj.angle ?? 0,
      });
    });

    fabricRef.current = c;

    return () => {
      c.dispose();
      fabricRef.current = null;
      objectRefs.current.clear();
    };
  }, []);

  // Keep track of the background image URL to avoid reloading it if it hasn't changed
  const lastBgImageRef = useRef<string | undefined>('');

  // Render/update objects when slide data changes
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;

    isUpdatingRef.current = true;

    // 1. Sync Background
    c.set('backgroundColor', slide.backgroundColor || '#FFFFFF');
    if (slide.backgroundImage !== lastBgImageRef.current) {
      lastBgImageRef.current = slide.backgroundImage;
      if (slide.backgroundImage) {
        FabricImage.fromURL(slide.backgroundImage, { crossOrigin: 'anonymous' }).then((img) => {
          img.scaleToWidth(CANVAS_W);
          img.scaleToHeight(CANVAS_H);
          c.backgroundImage = img;
          c.renderAll();
        }).catch(() => {
          c.backgroundImage = undefined as any;
        });
      } else {
        c.backgroundImage = undefined as any;
      }
    }

    // 2. Reconciliation of objects
    const currentIds = new Set(slide.objects.map(o => o.id));

    // Remove objects that are no longer in slide
    for (const [id, fo] of objectRefs.current.entries()) {
      if (!currentIds.has(id)) {
        c.remove(fo);
        objectRefs.current.delete(id);
      }
    }

    // Add or update existing objects
    for (const obj of slide.objects) {
      const existingFo = objectRefs.current.get(obj.id);
      const isOffset = offsetObjectIds.includes(obj.id);
      if (existingFo && isFabricObjectCompatible(existingFo, obj)) {
        updateFabricObject(existingFo, obj, isOffset);
      } else {
        if (existingFo) {
          c.remove(existingFo);
          objectRefs.current.delete(obj.id);
        }
        const newFo = slideObjectToFabric(obj, isOffset);
        if (newFo) {
          c.add(newFo);
          objectRefs.current.set(obj.id, newFo);
        }
      }
    }

    // Sort objects by their order in slide.objects to preserve z-index ordering
    slide.objects.forEach((obj, index) => {
      const fo = objectRefs.current.get(obj.id);
      if (fo) {
        c.moveObjectTo(fo, index);
      }
    });

    // 3. Keep selected object active
    if (selectedObjectId) {
      const activeObj = objectRefs.current.get(selectedObjectId);
      if (activeObj && c.getActiveObject() !== activeObj) {
        c.setActiveObject(activeObj);
      }
    } else {
      c.discardActiveObject();
    }

    c.renderAll();
    isUpdatingRef.current = false;
  }, [slide, selectedObjectId, offsetObjectIds]);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white inline-block">
      <canvas ref={canvasElRef} />
    </div>
  );
}

function slideObjectToFabric(obj: SlideObject, isOffset: boolean): FabricObjectWithId | null {
  const x = obj.x * SCALE;
  const y = obj.y * SCALE;
  const w = obj.width * SCALE;
  const h = obj.height * SCALE;

  const setId = (fo: FabricObject): FabricObjectWithId => {
    (fo as FabricObjectWithId)._objId = obj.id;
    return fo as FabricObjectWithId;
  };

  const strokeColor = isOffset ? '#FF0000' : obj.stroke;
  const strokeWidth = isOffset ? 2 : (obj.strokeWidth || 0);

  switch (obj.type) {
    case 'text':
      return setId(
        new Textbox(obj.text || '', {
          left: x,
          top: y,
          width: Math.max(w, 20),
          fontSize: Math.max((obj.fontSize || 24) * SCALE, 4),
          fontFamily: obj.fontFamily || 'Calibri',
          fontWeight: (obj.fontWeight as any) || 'normal',
          fill: obj.fontColor || '#000000',
          textAlign: obj.textAlign || 'left',
          angle: obj.rotation || 0,
          stroke: isOffset ? '#FF0000' : undefined,
          strokeWidth: isOffset ? 1 : 0,
        })
      );

    case 'shape':
      if (obj.shapeType === 'circle') {
        return setId(
          new Ellipse({
            left: x,
            top: y,
            rx: Math.max(w / 2, 1),
            ry: Math.max(h / 2, 1),
            fill: obj.fill || '#CCCCCC',
            stroke: strokeColor,
            strokeWidth: strokeWidth * SCALE,
            angle: obj.rotation || 0,
          })
        );
      }
      return setId(
        new Rect({
          left: x,
          top: y,
          width: Math.max(w, 1),
          height: Math.max(h, 1),
          rx: obj.shapeType === 'rounded-rect' ? 8 * SCALE : 0,
          ry: obj.shapeType === 'rounded-rect' ? 8 * SCALE : 0,
          fill: obj.fill || (obj.shapeType === 'line' ? obj.stroke : null) || '#CCCCCC',
          stroke: strokeColor,
          strokeWidth: strokeWidth * SCALE,
          angle: obj.rotation || 0,
        })
      );

    case 'icon':
      return setId(
        new Rect({
          left: x,
          top: y,
          width: Math.max(w, 1),
          height: Math.max(h, 1),
          fill: obj.iconColor || obj.fill || '#E0E0E0',
          rx: 4 * SCALE,
          ry: 4 * SCALE,
          angle: obj.rotation || 0,
          stroke: isOffset ? '#FF0000' : undefined,
          strokeWidth: isOffset ? 2 * SCALE : 0,
        })
      );

    default:
      return null;
  }
}

function isFabricObjectCompatible(fo: FabricObjectWithId, obj: SlideObject): boolean {
  if (obj.type === 'text') return fo instanceof Textbox;
  if (obj.type === 'shape') {
    if (obj.shapeType === 'circle') return fo instanceof Ellipse;
    return fo instanceof Rect && !(fo instanceof Textbox) && !(fo instanceof Ellipse);
  }
  if (obj.type === 'icon') {
    return fo instanceof Rect && !(fo instanceof Textbox) && !(fo instanceof Ellipse);
  }
  return false;
}

function updateFabricObject(fo: FabricObjectWithId, obj: SlideObject, isOffset: boolean) {
  const x = obj.x * SCALE;
  const y = obj.y * SCALE;
  const w = obj.width * SCALE;
  const h = obj.height * SCALE;

  fo.set({
    left: x,
    top: y,
    angle: obj.rotation || 0,
  });

  const strokeColor = isOffset ? '#FF0000' : obj.stroke;
  const strokeWidth = isOffset ? 2 : (obj.strokeWidth || 0);

  if (obj.type === 'text' && fo instanceof Textbox) {
    fo.set({
      text: obj.text || '',
      width: Math.max(w, 20),
      fontSize: Math.max((obj.fontSize || 24) * SCALE, 4),
      fontFamily: obj.fontFamily || 'Calibri',
      fontWeight: (obj.fontWeight as any) || 'normal',
      fill: obj.fontColor || '#000000',
      textAlign: obj.textAlign || 'left',
      stroke: isOffset ? '#FF0000' : undefined,
      strokeWidth: isOffset ? 1 : 0,
    });
  } else if (obj.type === 'shape') {
    if (obj.shapeType === 'circle' && fo instanceof Ellipse) {
      fo.set({
        rx: Math.max(w / 2, 1),
        ry: Math.max(h / 2, 1),
        fill: obj.fill || '#CCCCCC',
        stroke: strokeColor,
        strokeWidth: strokeWidth * SCALE,
      });
    } else if (fo instanceof Rect) {
      fo.set({
        width: Math.max(w, 1),
        height: Math.max(h, 1),
        rx: obj.shapeType === 'rounded-rect' ? 8 * SCALE : 0,
        ry: obj.shapeType === 'rounded-rect' ? 8 * SCALE : 0,
        fill: obj.fill || (obj.shapeType === 'line' ? obj.stroke : null) || '#CCCCCC',
        stroke: strokeColor,
        strokeWidth: strokeWidth * SCALE,
      });
    }
  } else if (obj.type === 'icon' && fo instanceof Rect) {
    fo.set({
      width: Math.max(w, 1),
      height: Math.max(h, 1),
      fill: obj.iconColor || obj.fill || '#E0E0E0',
      stroke: isOffset ? '#FF0000' : undefined,
      strokeWidth: isOffset ? 2 * SCALE : 0,
    });
  }

  fo.setCoords();
}
