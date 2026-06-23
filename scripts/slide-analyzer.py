#!/usr/bin/env python3
"""
Slide Analyzer: OpenCV edge detection + color sampling.
Extracts SHAPES with pixel-perfect coordinates and exact hex colors.
Does NOT do OCR — that's left to the vision model.
"""
import sys, json, cv2, numpy as np

def analyze_shapes(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return {"error": f"Cannot read {image_path}"}
    
    h, w = img.shape[:2]
    
    # 1. Background color (sample corners + center)
    corners = [
        img[5, 5], img[5, w-5], img[h-5, 5], img[h-5, w-5],
        img[h//4, w//4], img[h//4, 3*w//4], img[3*h//4, w//4], img[3*h//4, 3*w//4],
    ]
    bg_bgr = np.median(corners, axis=0).astype(int)
    bg_hex = '#{:02x}{:02x}{:02x}'.format(bg_bgr[2], bg_bgr[1], bg_bgr[0])
    
    # 2. Edge detection for shapes
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Detect rectangles/cards using contour detection
    # Blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Adaptive thresholding
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                    cv2.THRESH_BINARY_INV, 11, 2)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    shapes = []
    min_area = (w * h) * 0.005  # 0.5% of image
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area:
            continue
        
        # Get bounding rect
        x, y, cw, ch = cv2.boundingRect(contour)
        
        # Skip if too small
        if cw < 30 or ch < 15:
            continue
        
        # Sample color at center of the shape
        cx, cy = x + cw // 2, y + ch // 2
        if cy < h and cx < w:
            pixel = img[min(cy, h-1), min(cx, w-1)]
            fill_hex = '#{:02x}{:02x}{:02x}'.format(pixel[2], pixel[1], pixel[0])
        else:
            fill_hex = '#FFFFFF'
        
        # Determine shape type
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        
        if len(approx) == 4:
            # Check if rounded
            ratio = area / (cw * ch)
            if ratio > 0.95:
                shape_type = "rect"
            else:
                shape_type = "roundRect"
        elif len(approx) > 8:
            shape_type = "ellipse"
        else:
            shape_type = "rect"
        
        shapes.append({
            "type": "shape",
            "shapeType": shape_type,
            "x": int(x),
            "y": int(y),
            "width": int(cw),
            "height": int(ch),
            "fill": fill_hex,
            "area": int(area),
        })
    
    # Sort by area descending (largest first)
    shapes.sort(key=lambda s: s["area"], reverse=True)
    
    # Remove shapes that are mostly contained in larger shapes (keep only top-level containers)
    filtered = []
    for s in shapes:
        contained = False
        for f in filtered:
            # Check if s is inside f
            if (s["x"] >= f["x"] - 5 and s["y"] >= f["y"] - 5 and
                s["x"] + s["width"] <= f["x"] + f["width"] + 5 and
                s["y"] + s["height"] <= f["y"] + f["height"] + 5):
                contained = True
                break
        if not contained:
            filtered.append(s)
    
    # Remove area field from output
    for s in filtered:
        del s["area"]
    
    return {
        "imageWidth": w,
        "imageHeight": h,
        "backgroundColor": bg_hex,
        "shapes": filtered[:20],  # Max 20 shapes
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 slide-analyzer.py <image_path>"}))
        sys.exit(1)
    
    result = analyze_shapes(sys.argv[1])
    print(json.dumps(result, ensure_ascii=False))
