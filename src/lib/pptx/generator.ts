import PptxGenJS from 'pptxgenjs';
import type { Slide, SlideObject } from '@/lib/slide/types';
import { TEMPLATE_RENDERERS, reconstructContentFromObjects } from '@/lib/layouts/templates';
import type { LayoutType } from '@/lib/layouts/definitions';

const SLIDE_WIDTH = 12; // inches (16:9)
const SLIDE_HEIGHT = 6.75; // inches (16:9)

export function generatePptx(slide: Slide): PptxGenJS {
  if (slide.layoutType && slide.layoutContent) {
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'CUSTOM_16_9', width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
    pptx.layout = 'CUSTOM_16_9';

    const reconstructedContent = reconstructContentFromObjects(
      slide.layoutType as LayoutType,
      slide.objects,
      slide.layoutContent
    );

    const renderer = TEMPLATE_RENDERERS[slide.layoutType as LayoutType];
    if (renderer) {
      renderer(pptx, reconstructedContent);
      return pptx;
    }
  }

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CUSTOM_16_9', width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
  pptx.layout = 'CUSTOM_16_9';

  const pptxSlide = pptx.addSlide();

  // Background image (the full print/screenshot)
  if (slide.backgroundImage) {
    pptxSlide.addImage({
      path: slide.backgroundImage,
      x: 0,
      y: 0,
      w: SLIDE_WIDTH,
      h: SLIDE_HEIGHT,
    });
  } else if (slide.backgroundColor) {
    pptxSlide.background = { fill: slide.backgroundColor };
  }

  for (const obj of slide.objects) {
    // Convert from 1280x720 coords to inches
    const x = (obj.x / 1280) * SLIDE_WIDTH;
    const y = (obj.y / 720) * SLIDE_HEIGHT;
    const w = (obj.width / 1280) * SLIDE_WIDTH;
    const h = (obj.height / 720) * SLIDE_HEIGHT;

    switch (obj.type) {
      case 'text':
        pptxSlide.addText(obj.text || '', {
          x,
          y,
          w,
          h,
          fontSize: obj.fontSize ? obj.fontSize * 0.6 : 18,
          fontFace: obj.fontFamily || 'Calibri',
          bold: obj.fontWeight === 'bold',
          align: (obj.textAlign as 'left' | 'center' | 'right') || 'left',
          color: obj.fontColor || '000000',
          valign: 'middle',
          rotate: obj.rotation,
        });
        break;

      case 'shape': {
        const shapeTypeMap: Record<string, string> = {
          'rounded-rect': 'roundRect',
          rect: 'rect',
          circle: 'ellipse',
          line: 'line',
          arrow: 'rightArrow',
        };

        pptxSlide.addShape(
          pptx.ShapeType[
            shapeTypeMap[obj.shapeType || 'rect'] as keyof typeof pptx.ShapeType
          ] || pptx.ShapeType.rect,
          {
            x,
            y,
            w,
            h,
            fill: { color: obj.fill || 'CCCCCC' },
            line: obj.stroke
              ? { color: obj.stroke, width: obj.strokeWidth || 1 }
              : undefined,
            rotate: obj.rotation,
          }
        );
        break;
      }

      case 'image':
        if (obj.src) {
          pptxSlide.addImage({
            path: obj.src,
            x,
            y,
            w,
            h,
            rotate: obj.rotation,
          });
        }
        break;

      case 'icon':
        // If we have a real icon image (downloaded from Flaticon)
        if (obj.iconSrc) {
          // iconSrc is a base64 data URL — embed as image
          pptxSlide.addImage({
            path: obj.iconSrc,
            x,
            y,
            w: Math.min(w, h), // square
            h: Math.min(w, h),
            rotate: obj.rotation,
          });
        } else {
          // Fallback: colored rounded rect placeholder with Lucide name
          pptxSlide.addShape(pptx.ShapeType.roundRect, {
            x,
            y,
            w,
            h,
            fill: { color: (obj.fill || obj.iconColor) || 'E0E0E0' },
            rotate: obj.rotation,
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
              color: obj.iconColor || '666666',
            });
          }
        }
        break;

      default:
        break;
    }
  }

  return pptx;
}

export async function downloadPptx(
  pptx: PptxGenJS,
  filename: string = 'slide.pptx'
): Promise<void> {
  await pptx.writeFile({ fileName: filename });
}