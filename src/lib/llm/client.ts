/**
 * Generic LLM client for OpenAI-compatible APIs.
 * Works with any provider: DeepSeek, qwen-vl-plus, Gemini (via compat layer), etc.
 */

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | LLMContentPart[];
}

export type LLMContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }; // base64 data URL

export interface LLMRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
}

export async function callLLM(config: LLMConfig, request: LLMRequest): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 4096,
      response_format: request.responseFormat,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call the LLM and parse response as JSON.
 */
export async function callLLMJSON<T>(config: LLMConfig, request: LLMRequest): Promise<T> {
  const content = await callLLM(config, {
    ...request,
    responseFormat: { type: 'json_object' },
  });
  
  // Strip thinking/reasoning tags that some models add
  let cleaned = (content || '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')  // Remove <think> blocks
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')  // Remove <thinking> blocks
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  // Find the first JSON object { ... } in case there's text before/after
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  
  // Try to parse, and if truncated, try to fix common truncation issues
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    // If JSON is truncated (missing closing brackets), try to complete it
    let fixed = cleaned;
    
    // Count opening vs closing braces/brackets
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // Try again with completed JSON
    try {
      return JSON.parse(fixed) as T;
    } catch {
      // If still fails, throw the original error with context
      const jsonErr = e as Error;
      throw new Error(`JSON parse error at position ${'pos' in jsonErr ? (jsonErr as any).pos : '?'}: ${jsonErr.message}`);
    }
  }
}

// Get default config from env vars
export function getDefaultConfig(): LLMConfig {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.deepseek.com',
    model: process.env.LLM_MODEL || 'deepseek-chat',
  };
}

export function getVisionConfig(): LLMConfig {
  return {
    apiKey: process.env.VISION_API_KEY || process.env.LLM_API_KEY || '',
    baseUrl: process.env.VISION_BASE_URL || process.env.LLM_BASE_URL || 'https://api.deepseek.com',
    model: process.env.VISION_MODEL || process.env.LLM_MODEL || 'deepseek-vl2',
  };
}