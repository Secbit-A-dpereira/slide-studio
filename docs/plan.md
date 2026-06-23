# Plan: Slide Studio

## Architecture Overview

```
┌─────────────┐     POST /api/generate     ┌────────────────┐     Gemini Vision API
│   Browser   │  ────────────────────────→  │  Cloudflare    │  ──────────────────→
│  (Next.js)  │  ←────────────────────────  │  Worker (Hono) │  ←──────────────────
│  fabric.js  │    structured slide data    │                │
│  canvas     │                            └────────────────┘
│             │
│  PptxGenJS  │  ← export PPTX (100% client-side, no upload needed)
└─────────────┘
```

**Princípios:**
- **Free tier:** Gemini API free tier, Cloudflare Workers free plan, sem DB
- **Simples:** sem auth, sem persistência, estado em memória
- **Client-side PPTX:** gerado no browser com PptxGenJS, sem upload para servidor
- **Worker só para LLM:** chamadas Gemini passam pelo Worker (protege API key)

## Dependencies Graph

```
Phase A ──┬── 1. Project scaffolding (Next.js + Tailwind + deps)
           └── 2. Slide types / data model
           └── 3. Worker scaffolding (Hono + Gemini client)
                                     │
Phase B ──┬── 4. Upload zone + Worker route /api/generate
           │     └── 5. Parse Gemini response → SlideObject[]
           └── 6. Canvas editor (fabric.js) – render objects
           └── 7. Text-only generation fallback
                                     │
Phase C ──┬── 8. Object selection + highlight on canvas
           └── 9. LLM edit panel (select → prompt → edit single object)
           └── 10. Drag / resize / rotate (fabric.js built-in)
                                     │
Phase D ──┬── 11. PPTX export
           └── 12. Icon picker (Lucide)
           └── 13. Polish: loading states, errors, edge cases
```

**Riscos e Mitigações:**

| Risco | Mitigação |
|-------|-----------|
| Gemini Vision falha ao parsear imagem complexa | Instrução de sistema clara no prompt + fallback para objetos genéricos |
| fabric.js e React não gerem bem estado partilhado | Custom hook `useSlide` + ref para instância Canvas |
| Tamanho da imagem grande (rate limits Gemini) | Comprimir / redimensionar no frontend antes de enviar |
| PptxGenJS não suporta todos os tipos de objeto | Testar cedo com um objeto de cada tipo |
| Lucide icons em PPTX (SVG embed) | Converter SVG para blob URI, usar como imagem no PptxGenJS |

## Verification Checkpoints

1. **Após Phase A:** `npm run dev` abre, Worker responde `/api/health`
2. **Após Phase B:** Upload de print → objetos no canvas
3. **Após Phase C:** Clica objeto → prompt → altera só aquele objeto
4. **Após Phase D:** Export PPTX → abre no PowerPoint com objetos editáveis
