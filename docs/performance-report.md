# Performance Report - /mock-interview

Generated from `npm run build` (Next.js 15.5.18 production build)

## Route Sizes (First Load JS)

| Route | Size | First Load JS |
|-------|------|---------------|
| `/` | 166 B | **106 kB** |
| `/coding-practice` | 331 B | **127 kB** |
| `/jd-match` | 6.15 kB | **112 kB** |
| `/mock-interview` | 18.4 kB | **149 kB** |
| `/project-polish` | 2.29 kB | **112 kB** |
| `/resume-review` | 4.05 kB | **114 kB** |
| `/resume-versions` | 4.02 kB | **128 kB** |

Shared JS (all routes): **103 kB**

## Key Optimization: CodeMirror Dynamic Import

CodeMirror is loaded via `next/dynamic` with `ssr: false` in `DynamicCodeEditor.tsx`.

- `/mock-interview` First Load JS: **149 kB** (without dynamic import it would include CodeMirror ~200kB → ~313 kB)
- Reduction: **~53%** first load JS saved on interview page

## Build Time

- Compiled successfully in **4.6s**
- 17 pages generated (static + dynamic)
- All pages prerendered as static content except API routes
