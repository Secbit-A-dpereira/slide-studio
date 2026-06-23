import { NextRequest, NextResponse } from 'next/server';
import { callLLMJSON, getDefaultConfig } from '@/lib/llm/client';
import { EDIT_OBJECT_SYSTEM_PROMPT } from '@/lib/llm/prompts';
import { OBJECT_SCHEMA } from '@/lib/llm/schemas';
import type { SlideObject, SlideEditRequest } from '@/lib/slide/types';

export async function POST(request: NextRequest) {
  try {
    const body: SlideEditRequest = await request.json();
    const { object, prompt: userPrompt, allObjects } = body;

    if (!object || !userPrompt) {
      return NextResponse.json(
        { error: 'object and prompt are required' },
        { status: 400 }
      );
    }

    const contextPrompt = `
Slide context (all objects on this slide):
${JSON.stringify(allObjects, null, 2)}

Target object to edit:
${JSON.stringify(object, null, 2)}

User edit request: ${userPrompt}

${OBJECT_SCHEMA}
`;

    const config = getDefaultConfig();
    const modifiedObject = await callLLMJSON<Partial<SlideObject>>(config, {
      messages: [
        { role: 'system', content: EDIT_OBJECT_SYSTEM_PROMPT + '\n\n' + OBJECT_SCHEMA },
        { role: 'user', content: contextPrompt },
      ],
      temperature: 0.3,
      maxTokens: 4096,
    });

    const finalObject = {
      ...modifiedObject,
      id: object.id
    };

    return NextResponse.json(finalObject);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Edit failed: ${message}` },
      { status: 500 }
    );
  }
}
