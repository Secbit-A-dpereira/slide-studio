# Spec: Slide Studio

## Objective

App web que permite fazer upload de um print de slide (ou descrição textual) e obter uma réplica visual editável no browser com objetos reais (texto, formas, imagens, icons). O utilizador pode clicar num objeto e refiná-lo com LLM, ou arrastar/redimensionar manualmente. Export final em PPTX com objetos editáveis.

**User stories:**

1. Como utilizador, quero fazer upload de um print de slide e ver uma réplica visual editável.
2. Como utilizador, quero escrever uma descrição e ver o slide gerado do zero.
3. Como utilizador, quero clicar num objeto (texto, imagem, forma, icon) e pedir ao LLM para o alterar.
4. Como utilizador, quero arrastar, redimensionar e rodar objetos manualmente.
5. Como utilizador, quero exportar o slide como PPTX com objetos reais editáveis no PowerPoint.
6. Como utilizador, quero que a app sugira icons relevantes baseados no conteúdo do slide.

## Tech Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js | 16.2.6 (App Router) |
| Estilos | Tailwind CSS | 4.x |
| Canvas Editor | fabric.js | 6.x |
| API | Next.js API Routes (server-side) | - |
| LLM | Provider-agnostic (OpenAI-compatible) | DeepSeek / qwen-vl-plus |
| PPTX Export | PptxGenJS | 3.x |
| Icons | Lucide Icons | - |
| Deploy | Cloudflare Pages (futuro) | - |

## Commands

```bash
# Dev
npm run dev

# Build
npm run build

# Lint
npm run lint

# Deploy (futuro)
npm run build && wrangler pages deploy out/
```

## Project Structure

```
slide-studio/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Página principal
│   │   ├── layout.tsx                  # Layout global
│   │   ├── globals.css                 # Tailwind
│   │   └── api/
│   │       ├── analyze/route.ts        # POST — vision LLM → slide structure
│   │       └── edit/route.ts           # POST — text LLM → modify object
│   ├── components/
│   │   ├── upload-zone.tsx             # Dropzone / upload de imagem
│   │   ├── editor/
│   │   │   ├── slide-canvas.tsx        # Canvas fabric.js
│   │   │   └── object-toolbar.tsx      # Toolbar do objeto selecionado
│   │   ├── chat-panel.tsx              # Painel de chat LLM
│   │   ├── icon-picker.tsx             # Seletor de icons Lucide
│   │   └── export-button.tsx           # Export para PPTX
│   ├── lib/
│   │   ├── llm/
│   │   │   ├── client.ts              # LLM client genérico (OpenAI-compat)
│   │   │   ├── prompts.ts             # System prompts (analyse + edit)
│   │   │   └── schemas.ts             # JSON schema definitions
│   │   ├── pptx/
│   │   │   └── generator.ts           # PptxGenJS slide builder
│   │   └── slide/
│   │       ├── types.ts               # Slide data types
│   │       └── defaults.ts            # Default slide dimensions
│   └── hooks/
│       ├── use-slide.ts               # Slide state management
│       └── use-llm.ts                 # LLM interaction hook
├── .env.local                          # API keys (gitignored)
└── package.json
```

## Code Style

```typescript
// Naming: camelCase vars/functions, PascalCase components/types, kebab-case files
// Import order: React → libs → components → types → styles

import { useState, useCallback } from 'react';
import { Canvas, type FabricObject } from 'fabric';
import { SlideCanvas } from '@/components/editor/slide-canvas';
import type { SlideObject } from '@/lib/slide/types';
```

## Testing Strategy

*Phase 2 — inicialmente testes manuais. Adicionar Vitest depois do core flow estável.*

## Boundaries

**Always do:**
- Validar input antes de enviar para API
- Mostrar loading state durante chamadas LLM
- Fallback graceful quando LLM falha

**Ask first:**
- Adicionar dependências
- Mudar provider LLM
- Adicionar auth / DB / persistência

**Never do:**
- Commit de API keys
- Enviar ficheiros > 10MB

## Success Criteria

- [ ] Upload de print → slide renderizado com objetos detetados em < 15s
- [ ] Clica num objeto → painel de edição LLM abre
- [ ] Prompt "melhora este texto" → texto do objeto alterado, resto inalterado
- [ ] Drag/resize/rotate de objetos no canvas
- [ ] Seletor de icons Lucide
- [ ] Export PPTX → ficheiro com objetos reais
- [ ] PPTX abre no PowerPoint com texto editável
- [ ] Input textual → slide gerado do zero

## Provider LLM

- **Vision (analisar print):** qwen-vl-plus (via opencode-go provider, Aliyun endpoint — testado e funcional)
- **Text (editar objetos):** DeepSeek / qwen / configurável via .env
- Ambos suportam API OpenAI-compatible → cliente LLM unificado
