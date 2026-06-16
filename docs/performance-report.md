# Performance Optimization Report

Generated from `npm run build` with Next.js 15.5.18.

这份报告用于说明项目的性能优化不是泛泛而谈，而是围绕「首屏关键路径不要加载重依赖」做了可验证的拆包和按需加载。

## 1. 当前构建结果

| Route | Page Size | First Load JS | 说明 |
|---|---:|---:|---|
| `/` | 166 B | **106 kB** | 首页展示页，接近纯静态内容 |
| `/coding-practice` | 331 B | **127 kB** | IDE 页面，编辑器按需加载 |
| `/jd-match` | 6.15 kB | **112 kB** | 表单 + AI 请求状态 |
| `/mock-interview` | 18.4 kB | **149 kB** | 最复杂页面，包含状态机、评分、阶段面板 |
| `/project-polish` | 2.29 kB | **112 kB** | 项目优化表单 |
| `/resume-review` | 4.05 kB | **114 kB** | 文件上传 + 分析结果 |
| `/resume-versions` | 4.02 kB | **128 kB** | 版本时间线 + diff |

Shared JS: **103 kB**。

结论：最复杂的 `/mock-interview` 首屏 JS 控制在 **149 kB**；`/coding-practice` 虽然使用 CodeMirror，但 First Load 只有 **127 kB**，说明编辑器没有进入首屏公共包。

## 2. 优化前后对比

| 优化点 | 如果不优化 | 当前实现 | 收益 |
|---|---:|---:|---:|
| CodeMirror 编辑器 | `/mock-interview` 首屏可能携带约 200 kB 编辑器依赖，估算 First Load 约 **313 kB** | `DynamicCodeEditor` 使用 `next/dynamic` + `ssr: false`，只有进入代码作答场景才加载 | `/mock-interview` First Load 约 **149 kB**，节省约 **53%** |
| CodingWorkbench | 手写练习整棵组件树参与 SSR / 首屏加载 | `CodingWorkbenchLazy` 动态加载，IDE 只在访问练习页时加载 | 降低普通页面首屏负担 |
| PDF 解析 | `pdfjs-dist` 进入首屏 bundle | `parseResumeFile()` 中 `await import("pdfjs-dist")` | 只在上传 PDF 时加载 |
| Word 解析 | `mammoth` 进入首屏 bundle | `.docx` 分支中 `await import("mammoth/mammoth.browser")` | 只在上传 Word 时加载 |
| PDF 导出 | `html2canvas-pro` + `jspdf` 进入首屏 bundle | 点击导出 PDF 时动态 import | 避免导出能力污染首屏 |

说明：`313 kB` 是按当前 `/mock-interview` 149 kB + CodeMirror 相关依赖约 200 kB 的估算值，用于说明优化方向；最终以 `npm run build` 输出为准。

## 3. 关键优化实现

### 3.1 CodeMirror 动态加载

文件：`src/components/DynamicCodeEditor.tsx`

```tsx
const CodeEditor = dynamic(
  () => import("@/components/CodeEditor").then((mod) => mod.CodeEditor),
  {
    ssr: false,
    loading: () => <div>编辑器加载中...</div>,
  },
);
```

收益：

- CodeMirror 不进入 SSR。
- 不进入所有页面共享 chunk。
- 面试页只有识别到手写题作答时才展示编辑器。

### 3.2 IDE 工作台延迟加载

文件：`src/components/CodingWorkbenchLazy.tsx`

作用：手写练习页的复杂组件树不影响其他页面。状态逻辑集中在 `useCodingWorkbench`，UI 子组件通过 memo 拆分，减少无关重渲染。

### 3.3 文件解析能力按需加载

文件：`src/lib/resume-file.ts`

- `.pdf`：只在上传 PDF 时加载 `pdfjs-dist`。
- `.docx`：只在上传 Word 时加载 `mammoth`。

这样避免简历诊断页一打开就加载大型解析依赖。

### 3.4 PDF 导出能力按需加载

文件：`src/lib/export.ts`

```ts
const html2canvas = (await import("html2canvas-pro")).default;
const { jsPDF } = await import("jspdf");
```

导出功能属于低频动作，放入点击路径比放进首屏更合适。

## 4. 验证方式

本地验证：

```bash
npm run build
```

重点观察输出中的：

- `First Load JS shared by all`
- `/mock-interview`
- `/coding-practice`
- `/resume-review`

当前验证结果：

```text
/mock-interview      18.4 kB   149 kB
/coding-practice     331 B     127 kB
/resume-review       4.05 kB   114 kB
Shared JS                      103 kB
```

E2E 验证：

```bash
npm run test:e2e
```

已覆盖：导航、手写练习 IDE、模拟面试状态机、错误边界、移动端 375px、简历版本管理。

## 5. Vercel 部署后建议补充的性能证据

部署到 Vercel 后建议补充以下截图或报告，作为秋招项目展示材料：

1. **Vercel Deployment URL**：证明项目可在线访问。
2. **Lighthouse 报告**：至少截图首页和 `/mock-interview`。
3. **Network 面板截图**：展示 CodeMirror / PDF 解析依赖不是首屏加载。
4. **Performance 面板截图**：记录首屏加载和交互耗时。
5. **Bundle Analyzer 截图**：当前已有 `docs/screenshots/bundle-analysis.png`，可以和构建输出一起放入 README。
6. **Vercel Speed Insights**：部署后在 Vercel 控制台观察真实用户侧 LCP / CLS / INP，作为线上性能证据。

建议 README 中只写最终量化结果，不展开全部细节：

> 通过 `next/dynamic` 将 CodeMirror 和手写练习工作台拆出首屏路径，并对 PDF/Word 解析、PDF 导出依赖做动态加载，`/mock-interview` First Load JS 控制在约 149 kB，较直接打包编辑器依赖的估算方案减少约 53%。

## 6. PWA 缓存策略

`public/sw.js` 使用分层缓存策略：

| 资源 | 策略 | 原因 |
|---|---|---|
| `/api/*` | 不缓存 | AI 请求和用户数据不能被 Service Worker 缓存 |
| `/_next/static/*`、`/icon.svg`、`/manifest.json` | cache-first | 构建静态资源带 hash，适合长期缓存 |
| 页面路由 | network-first + cached fallback | 优先拿最新页面，离线时回退到缓存页面 |

这个策略避免把 AI 响应误缓存，同时让 Next.js 静态资源能更快命中缓存。

## 7. 面试回答模板

如果面试官问「你做过什么性能优化？」可以这样回答：

> 我主要优化的是首屏关键路径。项目里有 CodeMirror、pdfjs、mammoth、jspdf 这类比较重的依赖，如果直接静态 import，会污染共享 bundle。我把 CodeMirror 包装成 `DynamicCodeEditor`，用 `next/dynamic` 和 `ssr: false` 延迟到代码作答场景加载；PDF/Word 解析和 PDF 导出也都放到用户触发路径里动态 import。优化后 `/mock-interview` First Load JS 是 149 kB，`/coding-practice` 是 127 kB，说明编辑器没有进入首屏公共包。验证方式是 `next build` 的 route size 输出和 bundle analysis。

如果继续追问「为什么不用缓存 / CDN / 图片压缩？」可以补充：

> 这个项目当前主要瓶颈不是静态资源体积，而是重 JS 依赖是否进入首屏，所以优先做拆包和按需加载。部署到 Vercel 后，静态资源缓存和 CDN 由平台自动处理；下一步会结合 Lighthouse 和真实 Network waterfall 再做针对性优化。

如果继续追问「PWA 缓存怎么做？」可以补充：

> 我把 Service Worker 从统一 network-first 调整为分层缓存：API 请求不缓存，`/_next/static/` 等构建产物 cache-first，页面路由 network-first 并在离线时回退缓存。这样既能提升静态资源复用，又避免缓存 AI 接口或用户隐私数据。
