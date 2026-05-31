# Bundle Analysis Report

Generated from `npm run build` (Next.js 15.5.18)

## Shared Chunks (loaded by all routes)

| Chunk | Size |
|-------|------|
| `1255-eae4096fb21f1304.js` | 46 kB |
| `4bd1b696-100b9d70ed4e49c1.js` | 54.2 kB |
| other shared chunks | 2.37 kB |
| **Total shared** | **103 kB** |

## Per-Route JS (page-specific, on top of shared)

| Route | Page JS | Total First Load |
|-------|---------|-----------------|
| `/` (Home) | 166 B | 106 kB |
| `/coding-practice` | 331 B | 127 kB |
| `/jd-match` | 6.15 kB | 112 kB |
| `/mock-interview` | 18.4 kB | 149 kB |
| `/project-polish` | 2.29 kB | 112 kB |
| `/resume-review` | 4.05 kB | 114 kB |
| `/resume-versions` | 4.02 kB | 128 kB |

## Dynamic Import Analysis

### CodeMirror (via `DynamicCodeEditor.tsx`)

CodeMirror 6 + extensions (`@codemirror/lang-javascript`, `@codemirror/autocomplete`, `@codemirror/lint`, `@codemirror/theme-one-dark`, `@codemirror/view`, `@codemirror/state`) are **NOT included** in the shared bundle.

They are loaded client-side only when:
1. `/coding-practice` page renders `CodingWorkbenchLazy` → `CodingWorkbench` → `DynamicCodeEditor`
2. `/mock-interview` page detects a coding challenge → renders `DynamicCodeEditor`

Evidence: `/coding-practice` First Load is 127 kB (only 24 kB above shared), confirming CodeMirror loads as a separate async chunk.

### CodingWorkbench (via `CodingWorkbenchLazy.tsx`)

The entire `CodingWorkbench` component tree is also dynamically imported with `ssr: false`, ensuring:
- No SSR overhead for the coding IDE
- Lazy loaded only when the coding practice page is visited

### PDF Parser (via `resume-file.ts`)

`pdfjs-dist` is imported dynamically via `await import("pdfjs-dist")` inside `parseResumeFile()`, so it only loads when a user uploads a PDF file.

### PDF Export (via `export.ts`)

`html2canvas-pro` and `jspdf` are imported dynamically via `await import(...)` inside `downloadPdf()`, so they only load when a user clicks "导出 PDF".

## Key Takeaway

- **Shared bundle: 103 kB** — contains React, Next.js runtime, Zustand, Zod, and shared utilities
- **Heaviest page: `/mock-interview` at 149 kB** — includes interview store, stage panel, score board
- **CodeMirror isolated**: Not in shared bundle, loaded on-demand
- **No unexpected large dependencies** in the critical path
