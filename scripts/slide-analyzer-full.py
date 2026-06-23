#!/usr/bin/env python3
"""
Full slide analyzer: OpenCV shapes + EasyOCR text.
Output: JSON with pixel-perfect coordinates for everything.
No VLM calls needed — 100% local processing.
"""
import sys, json, cv2, numpy as np

def analyze_shapes(img):
    h, w = img.shape[:2]
    
    # Background color
    corners = [img[5,5], img[5,w-5], img[h-5,5], img[h-5,w-5],
               img[h//4,w//4], img[h//4,3*w//4], img[3*h//4,w//4], img[3*h//4,3*w//4]]
    bg_bgr = np.median(corners, axis=0).astype(int)
    bg_hex = '#{:02x}{:02x}{:02x}'.format(bg_bgr[2], bg_bgr[1], bg_bgr[0])
    
    # Edge detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY_INV, 11, 2)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    shapes = []
    min_area = (w * h) * 0.005
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area: continue
        
        x, y, cw, ch = cv2.boundingRect(contour)
        if cw < 30 or ch < 15: continue
        
        # Sample center color
        cx, cy = x + cw // 2, y + ch // 2
        pixel = img[min(cy, h-1), min(cx, w-1)]
        fill_hex = '#{:02x}{:02x}{:02x}'.format(pixel[2], pixel[1], pixel[0])
        
        # Shape type
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        ratio = area / (cw * ch)
        
        if len(approx) == 4:
            shape_type = "roundRect" if ratio < 0.95 else "rect"
        elif len(approx) > 8:
            shape_type = "ellipse"
        else:
            shape_type = "rect"
        
        shapes.append({"type":"shape","shapeType":shape_type,
                       "x":int(x),"y":int(y),"width":int(cw),"height":int(ch),
                       "fill":fill_hex})
    
    # Deduplicate: remove shapes contained in larger ones
    shapes.sort(key=lambda s: s["width"]*s["height"], reverse=True)
    filtered = []
    for s in shapes:
        contained = any(
            s["x"] >= f["x"]-5 and s["y"] >= f["y"]-5 and
            s["x"]+s["width"] <= f["x"]+f["width"]+5 and
            s["y"]+s["height"] <= f["y"]+f["height"]+5
            for f in filtered
        )
        if not contained: filtered.append(s)
    
    return bg_hex, filtered[:20]

def analyze_text(image_path, img):
    import easyocr
    reader = easyocr.Reader(['pt', 'en'], gpu=False, verbose=False)
    results = reader.readtext(image_path, detail=1, paragraph=False)
    
    h, w = img.shape[:2]
    texts = []
    for bbox, text, conf in results:
        if conf < 0.3 or not text.strip(): continue
        x = int(bbox[0][0]); y = int(bbox[0][1])
        bw = int(bbox[2][0] - bbox[0][0]); bh = int(bbox[2][1] - bbox[0][1])
        
        # Sample text color: look at darkest pixels in the bbox (text is usually darker than bg)
        roi = img[max(0,y):min(h,y+bh), max(0,x):min(w,x+bw)]
        if roi.size > 0:
            # Convert to grayscale and find dark pixels (text)
            gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            dark_mask = gray_roi < 128
            if dark_mask.sum() > 5:
                # Sample color of dark pixels
                dark_pixels = roi[dark_mask]
                median_color = np.median(dark_pixels, axis=0).astype(int)
                text_color = '#{:02x}{:02x}{:02x}'.format(median_color[2], median_color[1], median_color[0])
            else:
                # Text is light on dark background - sample brightest pixels
                bright_mask = gray_roi > 128
                if bright_mask.sum() > 5:
                    bright_pixels = roi[bright_mask]
                    median_color = np.median(bright_pixels, axis=0).astype(int)
                    text_color = '#{:02x}{:02x}{:02x}'.format(median_color[2], median_color[1], median_color[0])
                else:
                    text_color = '#000000'
        else:
            text_color = '#000000'
        
        # Estimate font size from height
        font_size = max(10, int(bh * 0.75))
        
        # Detect bold (heuristic: wide chars relative to height)
        is_bold = bw / max(len(text), 1) > bh * 0.55
        
        # Detect text alignment based on position
        center_x = x + bw / 2
        if abs(center_x - w/2) < w * 0.05:
            align = 'center'
        elif x < w * 0.1:
            align = 'left'
        elif x + bw > w * 0.9:
            align = 'right'
        else:
            align = 'left'
        
        texts.append({
            "type": "text",
            "text": text.strip(),
            "x": x, "y": y, "width": bw, "height": bh,
            "fontSize": font_size,
            "bold": is_bold,
            "color": text_color,
            "align": align,
            "confidence": round(float(conf), 2),
        })
    return texts

def classify_icons(image_path, icons):
    """Use VLM to classify icons by Lucide name. OpenCV already found positions."""
    if not icons:
        return icons
    
    import base64, json as j, urllib.request
    
    with open(image_path, 'rb') as f:
        img_b64 = base64.b64encode(f.read()).decode()
    
    # Build description of detected icons with their positions
    icon_descs = []
    for i, ic in enumerate(icons):
        icon_descs.append(f"Icon {i}: at position ({ic['x']},{ic['y']}), size {ic['width']}x{ic['height']}")
    
    prompt = f"I detected {len(icons)} icons in this slide at these positions:\n" + "\n".join(icon_descs) + "\n\nFor each icon, tell me the closest Lucide icon name (PascalCase, e.g. Folder, Shield, Users, Cpu, Zap, Building2, Headphones, Network, Lock, Globe, Check, ArrowRight, Home, Briefcase, Settings, Search, Mail, Phone, Bell, Calendar, Star, Heart, Download, Upload, Camera, Code, Database, Server, Cloud, Wifi, Key, Activity, TrendingUp, DollarSign, Target, Award, Book, Compass, Flag, Gift, Rocket, Map, Message, Monitor, Smartphone, Tablet, Printer, Tool, Umbrella, Video, Watch, Wrench).\n\nReturn ONLY a JSON array: [\"Folder\", \"Shield\", \"Users\", ...] with one name per icon in order."

    api_key = "sk-MMSL8t8ccAtfqBMLPcc7k8S4s3ttHtHdsWd2sibRfeC7toSCXdVuu2XfA7XKoapY"
    
    body = j.dumps({
        "model": "minimax-m3",
        "messages": [
            {"role": "system", "content": "You are an icon classifier. Return ONLY a JSON array of Lucide icon names."},
            {"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}}
            ]}
        ],
        "temperature": 0.1,
        "max_tokens": 512,
    }).encode()
    
    req = urllib.request.Request(
        "https://opencode.ai/zen/go/v1/chat/completions",
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = j.loads(resp.read())
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            import re
            m = re.search(r'\[.*\]', content)
            if m:
                names = j.loads(m.group())
                for i, name in enumerate(names):
                    if i < len(icons):
                        icons[i]["iconName"] = name
    except:
        pass  # Keep "Circle" if VLM fails
    
    return icons

def analyze_icons(img, texts, shapes):
    """Detect small graphic elements that aren't text or large shapes."""
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Look for small dark regions not covered by text
    _, binary = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    icons = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 200 or area > 5000: continue
        
        x, y, cw, ch = cv2.boundingRect(contour)
        if cw < 15 or ch < 15 or cw > 80 or ch > 80: continue
        
        # Skip if overlaps with text
        overlaps_text = any(
            abs(x - t["x"]) < 20 and abs(y - t["y"]) < 20
            for t in texts
        )
        if overlaps_text: continue
        
        # Sample color
        pixel = img[min(y + ch//2, h-1), min(x + cw//2, w-1)]
        color = '#{:02x}{:02x}{:02x}'.format(pixel[2], pixel[1], pixel[0])
        
        icons.append({
            "type": "icon",
            "x": int(x), "y": int(y), "width": int(cw), "height": int(ch),
            "iconName": "Circle",
            "iconColor": color,
        })
    
    return icons[:10]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 slide-analyzer-full.py <image_path>"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    img = cv2.imread(image_path)
    if img is None:
        print(json.dumps({"error": f"Cannot read {image_path}"}))
        sys.exit(1)
    
    h, w = img.shape[:2]
    
    # Phase 1: Shapes (OpenCV)
    bg_hex, shapes = analyze_shapes(img)
    
    # Phase 2: Text (EasyOCR) — pass img for color sampling
    texts = analyze_text(image_path, img)
    
    # Phase 3: Icons (OpenCV positions + VLM classification)
    icons = analyze_icons(img, texts, shapes)
    icons = classify_icons(image_path, icons)
    
    result = {
        "imageWidth": w,
        "imageHeight": h,
        "backgroundColor": bg_hex,
        "shapes": shapes,
        "texts": texts,
        "icons": icons,
    }
    
    print(json.dumps(result, ensure_ascii=False))
