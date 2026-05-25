# AI Career Studio

面向前端实习 / 校招场景的 AI 求职训练工作台。覆盖 JD 匹配、简历诊断、项目经历优化和多轮模拟面试追问，所有分析均由真实 AI 驱动，输出结构化评分、风险点、追问链和复盘报告。

## 功能概览

### 1. JD 匹配（`/jd-match`）

输入目标岗位 JD 和简历材料，AI 分析匹配程度并给出行动建议。

- **匹配评分**：0-100 分，综合技能覆盖率、项目相关性和经验匹配度
- **命中关键词**：JD 和简历都明确提到的具体技能或经验
- **缺失项**：JD 明确要求但简历中缺失的关键技能
- **改写建议**：针对该 JD 的简历修改方向
- **面试准备方向**：基于匹配和缺失结果的面试备考策略

### 2. 简历诊断（`/resume-review`）

支持粘贴文本或上传文件（`.txt` / `.md` / `.json` / `.docx`），AI 输出结构化评估。

- **综合评分**：基于项目完整度、技术深度、量化成果、表达清晰度
- **优势分析**：引用简历中的具体内容指出亮点
- **风险诊断**：指出简历中的具体缺陷或缺失项
- **优化建议**：候选人可立即执行的具体改进动作

### 3. 项目优化（`/project-polish`）

输入原始项目描述，AI 转换为大厂前端简历风格表达。

- **优化后描述**：用"问题-方案-结果"结构重写
- **亮点拆解**：指出原始描述和优化后描述的关键差异
- **面试追问点**：面试官基于优化后描述可能追问的真实问题
- **简历 bullet**：可直接放入简历的条目，包含动作动词 + 技术细节 + 可量化结果

### 4. 模拟面试（`/mock-interview`）

核心功能。上传或粘贴真实简历后，AI 面试官进行多轮追问。

**面试流程**：
1. 上传/粘贴简历 → AI 解析项目、实习、技能线索
2. 生成追问计划：简历相关追问点 + 前端岗位高频基础题交叉穿插
3. 逐轮回答 → AI 根据回答质量生成下一问 + 分项评分
4. 结束面试 → AI 生成个性化复盘报告

**两种面试模式**：
- **练习模式**：允许手动切换追问点，适合打磨 STAR 表达
- **连贯追问模式**：AI 面试官主导深挖和切题，模拟真实面试节奏

**每轮追问包含**：
- 触发依据：说明追问来自回答或简历的哪个具体点
- 考察维度：本轮追问评估的能力方向
- 合格标准：合格回答需要覆盖的 3-5 个关键点
- 逻辑边界：追问不会越界到哪些范围

**AI 动态评分**（每轮）：
- 技术准确性（0-30）
- 表达结构（0-25）
- 项目深度（0-25）
- 异常边界（0-20）
- 复盘意识（0-15）
- 一句话点评

**AI 复盘报告**（面试结束后）：
- 总体评价
- 具体优势（引用实际回答）
- 具体短板（指出哪些回答不足）
- 可执行改进建议
- 面试可投递性判断

### 5. 首页（`/`）

作品集展示页，包含能力矩阵、工作流设计、技术栈和核心数据指标。

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 15（App Router） |
| 语言 | TypeScript（strict mode） |
| 样式 | Tailwind CSS 3 |
| AI 接口 | OpenAI-compatible Chat Completions API |
| 文件解析 | mammoth（浏览器端 .docx 解析） |
| 测试 | vitest |

## 模块设计

```
src/
├── app/                          # Next.js App Router 页面和 API
│   ├── page.tsx                  # 首页
│   ├── layout.tsx                # 全局 layout（深色主题 + 导航）
│   ├── jd-match/page.tsx         # JD 匹配页
│   ├── resume-review/page.tsx    # 简历诊断页
│   ├── project-polish/page.tsx   # 项目优化页
│   ├── mock-interview/page.tsx   # 模拟面试页
│   └── api/
│       ├── interview-ai/route.ts # 模拟面试 AI 接口（plan/round/review）
│       ├── resume-review/route.ts# 简历诊断 AI 接口
│       ├── jd-match/route.ts     # JD 匹配 AI 接口
│       └── project-polish/route.ts# 项目优化 AI 接口
│
├── components/
│   ├── InterviewTrainer.tsx      # 模拟面试主组件（薄 shell，组装子组件）
│   ├── JdMatchWorkbench.tsx      # JD 匹配工作台
│   ├── ProjectPolishWorkbench.tsx# 项目优化工作台
│   ├── ResumeReviewWorkbench.tsx # 简历诊断工作台
│   ├── SiteNav.tsx               # 全局导航栏
│   └── interview/                # 模拟面试子组件
│       ├── ScoreBoard.tsx        # 实时评分面板
│       ├── ReviewPanel.tsx       # 复盘报告面板
│       └── QuestionChain.tsx     # 追问链列表
│
├── hooks/
│   └── useInterviewSession.ts    # 模拟面试全部状态和业务逻辑
│
├── lib/
│   ├── ai-client.ts              # 共享 AI 请求工具（requestChatCompletion / parseModelJson）
│   ├── interview-core.ts         # 面试核心类型、评分函数、基础题库
│   ├── analysis.ts               # 本地分析函数（AI 不可用时的 fallback）
│   ├── resume-file.ts            # 浏览器端简历文件解析（txt/md/json/docx）
│   └── __tests__/                # 单元测试
│       ├── interview-core.test.ts
│       ├── resume-file.test.ts
│       └── analysis.test.ts
│
├── data/
│   └── site.ts                   # 首页静态数据（导航、能力矩阵、工作流等）
│
└── types/
    └── mammoth-browser.d.ts      # mammoth 类型声明
```

### 关键设计决策

**1. AI 请求走服务端 API Route**

所有 AI 请求通过 Next.js API Route 代理，API Key 存在 `.env.local`，前端不接触密钥。支持任意 OpenAI-compatible 服务（DeepSeek、OpenAI、Mindflow 等）。

**2. 本地函数作为 Fallback**

`analysis.ts` 中的 `buildReview`、`matchJd`、`polishProject` 在 AI Key 未配置时作为降级方案，保证简历诊断、JD 匹配、项目优化页面不依赖 AI 也能展示基础结果。

**3. 面试追问的深度控制**

连贯追问模式下，前端设置 `autoModeMaxDepth = 2` 作为兜底，防止 AI 在同一追问点无限深挖。AI 本身也有 prompt 层面的切题规则（`currentDepth >= 2` 时必须切换），形成双重保障。

**4. 基础题穿插策略**

`interleaveTopics` 函数将 AI 从简历中提取的项目追问点与预置的 11 道前端基础题（HTTP 缓存、事件循环、原型链、CSS 布局等）交叉排列，模拟真实一面的节奏。

**5. 组件拆分策略**

模拟面试页原本是 878 行的单体组件，现在拆为：
- `useInterviewSession` hook：所有状态（20+ useState）和业务逻辑（API 调用、追问推进、评分管理）
- `InterviewTrainer`：薄 shell，只负责组装子组件和传递 props
- 3 个子组件：`ScoreBoard`、`ReviewPanel`、`QuestionChain`，各自独立渲染

## 本地运行

```bash
npm install
npm run dev
```

构建和测试：

```bash
npm run build
npm run test
npm run lint
```

## AI 配置

新建 `.env.local`，配置任意 OpenAI-compatible 服务：

```env
# DeepSeek
AI_BASE_URL=https://api.deepseek.com/v1
AI_API_KEY=your_key_here
AI_MODEL=deepseek-chat

# 或 OpenAI
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_key_here
AI_MODEL=gpt-4o-mini
```

**四个 API Route 均依赖此配置**：

| 路径 | 功能 | 无 Key 时行为 |
|---|---|---|
| `/api/resume-review` | 简历诊断 | 降级为本地正则分析 |
| `/api/jd-match` | JD 匹配 | 降级为本地关键词匹配 |
| `/api/project-polish` | 项目优化 | 降级为本地模板改写 |
| `/api/interview-ai` | 模拟面试（plan/round/review） | 返回 503 错误，不启动面试 |

## 简历文件支持

| 格式 | 解析方式 |
|---|---|
| `.txt` / `.md` | 直接读取文本 |
| `.json` | JSON.parse 后格式化 |
| `.docx` | mammoth 浏览器端提取纯文本 |
| `.pdf` | 暂不支持，建议复制文本粘贴或转为 .docx |

## 后续迭代方向

### P2 — 产品体验提升

- **SSE 流式输出**：当前 AI 接口等全部生成完再返回，改为 SSE 逐字输出，提升交互体验
- **面试历史持久化**：用 localStorage 或 IndexedDB 存储历史面试记录，支持查看过往复盘、对比进步
- **多页面数据流转**：JD 匹配结果自动带到模拟面试作为上下文，简历诊断发现的短板作为重点追问方向
- **导出能力**：复盘报告导出 PDF / 下载 Markdown，简历诊断结果一键复制
- **子页面独立 Metadata**：每个页面独立的 title / description，提升 SEO

### P3 — 高阶功能

- **语音模拟面试**：接入 Web Speech API 或 Whisper，语音回答 → 转文字 → AI 追问
- **Prompt 可观测性**：开发模式下可视化展示每次 AI 请求的 prompt、token 用量、响应时间
- **多角色面试官**：支持选择不同面试风格（温和型 / 压力型 / 技术深挖型）
- **移动端 PWA**：manifest.json + Service Worker，支持手机端离线访问本地分析功能

### P4 — 工程化完善

- **CI/CD**：GitHub Actions 自动 lint → type-check → test → build
- **lint-staged + husky**：提交前自动格式化和 lint
- **E2E 测试**：Playwright 覆盖核心用户流程
- **错误边界**：页面级 `error.tsx` + `loading.tsx`
- **无障碍**：完善 aria-label、键盘导航支持

## 部署

推荐部署到 Vercel。在 Vercel 项目设置中配置环境变量（`AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL`）后即可使用全部 AI 功能。

## 可写入简历的项目描述

> AI Career Studio：基于 Next.js 15 + TypeScript 搭建 AI 求职训练工作台，覆盖 JD 匹配、简历诊断、项目优化和多轮模拟面试追问四大模块；设计结构化 AI 输出协议，将简历解析、岗位基础题穿插、追问链、动态分项评分和个性化复盘拆分为可复用数据模块；通过自定义 Hook 管理面试会话状态，拆分 800+ 行组件为 hook + 子组件架构；接入 DeepSeek / OpenAI-compatible API，实现回答驱动的真实面试流程，27 个单元测试覆盖核心逻辑。
