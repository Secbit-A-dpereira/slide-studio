// JSON Schema definitions to pass to LLM for structured output

export const SLIDE_SCHEMA = `
You must respond with valid JSON in this exact structure:
{
  "objects": [
    {
      "id": string (unique ID, e.g., "obj_1", "obj_2"),
      "type": "text" | "shape" | "image" | "icon",
      "x": number (0-1000 normalized horizontal coordinate, where 0 is left and 1000 is right),
      "y": number (0-1000 normalized vertical coordinate, where 0 is top and 1000 is bottom),
      "width": number (0-1000 normalized width),
      "height": number (0-1000 normalized height),
      "rotation": number (rotation angle in degrees, usually 0),
      "text": string | null (EXACT verbatim text from the slide, do not paraphrase or summarize),
      "fontSize": number | null (approximate font size on a 1000-height scale, e.g. 24),
      "fontFamily": string | null (e.g. "Calibri" or "Arial"),
      "fontWeight": "normal" | "bold" | null,
      "textAlign": "left" | "center" | "right" | "justify" | null,
      "fontColor": string (approximate hex color) | null,
      "fill": string (approximate hex color) | null,
      "stroke": string (approximate hex color) | null,
      "strokeWidth": number | null (approximate stroke width),
      "shapeType": "rect" | "circle" | "rounded-rect" | "line" | null,
      "iconName": string | null (matching Lucide icon name, e.g. "ChevronRight", "Search", "Settings"),
      "iconColor": string (approximate hex color) | null,
      "iconSize": number | null
    }
  ],
  "backgroundColor": string (approximate hex color)
}
`;

export const OBJECT_SCHEMA = `
You must respond with valid JSON with a single modified object following the slide object schema. Return ONLY the object fields that changed.
`;