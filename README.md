# AI Career Studio

面向前端实习 / 校招场景的 AI 求职训练工作台。覆盖 JD 匹配、简历诊断、项目经历优化和多轮模拟面试追问，所有分析均由真实 AI 驱动，输出结构化评分、风险点、追问链和复盘报告。

项目重点不是做普通 Chatbot，而是把求职训练拆成**结构化任务流**，并通过**智能引导**在模块之间形成训练闭环。

## 功能概览

### 1. JD 匹配（`/jd-match`）

输入目标岗位 JD 和简历材料，AI 分析匹配程度并给出行动建议。

- **匹配评分**：0-100 分，综合技能覆盖率、项目相关性和经验匹配度
- **命中关键词**：JD 和简历都明确提到的具体技能或经验
- **缺失项**：JD 明确要求但简历中缺失的关键技能
- **改写建议**：针对该 JD 的简历修改方向
- **面试准备方向**：基于匹配和缺失结果的面试备考策略
- **智能引导**：分析完成后推荐"去模拟面试重点练缺失方向"或"去优化项目描述"，缺失项自动作为面试追问重点
- **一键复制**：分析结果一键复制到剪贴板

### 2. 简历诊断（`/resume-review`）

支持粘贴文本或上传文件（`.txt` / `.md` / `.json` / `.docx`），AI 输出结构化评估。

- **综合评分**：基于项目完整度、技术深度、量化成果、表达清晰度
- **优势分析**：引用简历中的具体内容指出亮点
- **风险诊断**：指出简历中的具体缺陷或缺失项
- **优化建议**：候选人可立即执行的具体改进动作
- **智能引导**：诊断完成后推荐"去优化项目描述"、"用这份简历开始模拟面试"，低分时建议"先做 JD 匹配"
- **打字机动画**：AI 结果逐字渲染，模拟流式输出效果
- **一键复制**：诊断结果一键复制

### 3. 项目优化（`/project-polish`）

输入原始项目描述，AI 转换为大厂前端简历风格表达。

- **优化后描述**：用"问题-方案-结果"结构重写，打字机逐字渲染
- **亮点拆解**：指出原始描述和优化后描述的关键差异
- **面试追问点**：面试官基于优化后描述可能追问的真实问题
- **简历 bullet**：可直接放入简历的条目，包含动作动词 + 技术细节 + 可量化结果

### 4. 模拟面试（`/mock-interview`）

核心功能。上传或粘贴真实简历后，AI 面试官进行多轮追问。

**面试流程**：
1. 上传/粘贴简历 → AI 解析项目、实习、技能线索
2. 生成追问计划：简历相关追问点 + **动态生成的岗位基础题**交叉穿插（根据目标岗位动态生成，不再依赖硬编码题库）
3. 逐轮回答 → AI 根据回答质量生成下一问 + 分项评分
4. 结束面试 → AI **流式生成**个性化复盘报告（真 SSE，逐字渲染）

**两种面试模式**：
- **练习模式**：允许手动切换追问点，适合打磨 STAR 表达
- **连贯追问模式**：AI 面试官主导深挖和切题，模拟真实面试节奏

**三种面试官角色**：
- **温和引导型**：耐心引导，给予充分思考时间，适合首次模拟
- **压力追问型**：节奏快、追问紧，模拟大厂真实高压面试
- **技术深挖型**：围绕技术细节不断深挖底层原理，考察知识边界

**每轮追问包含**：
- 触发依据：说明追问来自回答或简历的哪个具体点
- 考察维度：本轮追问评估的能力方向
- 合格标准：合格回答需要覆盖的 3-5 个关键点
- 逻辑边界：追问不会越界到哪些范围

**AI 动态评分**（每轮，标注 AI Score / 参考分）：
- 技术准确性（0-30）
- 表达结构（0-25）
- 项目深度（0-25）
- 异常边界（0-20）
- 复盘意识（0-15）
- 一句话点评

**AI 流式复盘报告**（面试结束后，SSE 逐字输出）：
- 总体评价
- 具体优势（引用实际回答）
- 具体短板（指出哪些回答不足）
- 可执行改进建议
- **推荐学习方向**（针对薄弱知识点的具体学习主题和建议顺序）
- 面试可投递性判断
- **智能引导**：复盘后推荐"针对短板再练一轮"或"回去优化简历表达"

**语音输入**：支持 Web Speech API 语音识别，实时转文字追加到回答框

**进步追踪**：≥2 次面试后展示 SVG 趋势折线图 + 五维度变化对比

**面试历史**：自动保存最近 20 条面试记录，支持展开查看、下载 Markdown、删除

### 5. 首页（`/`）

作品集展示页，包含能力矩阵、工作流设计、技术栈和核心数据指标。

### 6. 全局功能

- **用户自带 API Key**：导航栏设置面板，填入 Key/BaseURL/Model 后存 localStorage，所有请求自动通过 header 传递，优先级高于服务端 `.env.local`
- **PWA 支持**：manifest.json + Service Worker + SVG 图标，支持安装到桌面和离线访问
- **错误边界**：全局 error.tsx（带重试按钮）+ 每个页面独立的骨架屏 loading
- **无障碍**：导航栏 aria-label、设置面板 role="dialog"、语音按钮 aria-label
- **API 频率限制**：所有 AI 接口 30 次/分钟 IP 限制，防止滥用

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 15（App Router） |
| 语言 | TypeScript（strict mode） |
| 样式 | Tailwind CSS 3 |
| AI 接口 | OpenAI-compatible Chat Completions API（支持 SSE 流式） |
| 文件解析 | mammoth（浏览器端 .docx 解析） |
| 语音识别 | Web Speech API |
| 单元测试 | vitest（27 个测试） |
| E2E 测试 | Playwright（14 个测试） |
| 代码质量 | husky + lint-staged（提交前自动 eslint + tsc） |
| PWA | Service Worker + Web App Manifest |

## 模块设计

```
src/
├── app/                              # Next.js App Router 页面和 API
│   ├── page.tsx                      # 首页
│   ├── layout.tsx                    # 全局 layout（深色主题 + 导航 + PWA + SW 注册）
│   ├── error.tsx                     # 全局错误边界
│   ├── loading.tsx                   # 全局 loading
│   ├── jd-match/
│   │   ├── page.tsx                  # JD 匹配页（独立 metadata）
│   │   └── loading.tsx               # 骨架屏
│   ├── resume-review/
│   │   ├── page.tsx                  # 简历诊断页
│   │   └── loading.tsx
│   ├── project-polish/
│   │   ├── page.tsx                  # 项目优化页
│   │   └── loading.tsx
│   ├── mock-interview/
│   │   ├── page.tsx                  # 模拟面试页
│   │   └── loading.tsx
│   └── api/
│       ├── interview-ai/route.ts     # 模拟面试 AI 接口（plan/round/review + SSE 流式）
│       ├── resume-review/route.ts    # 简历诊断 AI 接口
│       ├── jd-match/route.ts         # JD 匹配 AI 接口
│       ├── project-polish/route.ts   # 项目优化 AI 接口
│       └── mock-ai/route.ts          # Legacy 兼容接口
│
├── components/
│   ├── InterviewTrainer.tsx          # 模拟面试主组件（薄 shell，组装子组件）
│   ├── JdMatchWorkbench.tsx          # JD 匹配工作台（含智能引导）
│   ├── ProjectPolishWorkbench.tsx    # 项目优化工作台（含打字机动画）
│   ├── ResumeReviewWorkbench.tsx     # 简历诊断工作台（含智能引导 + 打字机动画）
│   ├── SiteNav.tsx                   # 全局导航栏（含 AI 设置入口）
│   ├── AiSettingsPanel.tsx           # AI Key 设置面板（模态框）
│   ├── NextActions.tsx               # 智能引导卡片（跨页面复用）
│   ├── ServiceWorkerRegister.tsx     # SW 注册组件
│   └── interview/                    # 模拟面试子组件
│       ├── ScoreBoard.tsx            # 实时评分面板（AI Score / 参考分标注）
│       ├── ReviewPanel.tsx           # 复盘报告面板（SSE 流式 + 学习建议 + 引导）
│       ├── QuestionChain.tsx         # 追问链列表
│       ├── InterviewHistory.tsx      # 面试历史记录（展开/下载/删除）
│       └── ProgressTracker.tsx       # 进步追踪（SVG 趋势图 + 维度对比）
│
├── hooks/
│   ├── useInterviewSession.ts        # 模拟面试全部状态和业务逻辑
│   ├── useTypewriter.ts              # 打字机动画（单文本 + 列表）
│   └── useSpeechRecognition.ts       # 语音识别（Web Speech API）
│
├── lib/
│   ├── ai-client.ts                  # 共享 AI 请求工具（非流式 + 流式 + debug 元数据）
│   ├── ai-config-header.ts           # 从请求 header 提取用户 AI 配置
│   ├── fetch-ai.ts                   # 前端 fetch 封装（自动注入 localStorage AI Key）
│   ├── rate-limit.ts                 # IP 频率限制（内存 Map，30 次/分钟）
│   ├── storage.ts                    # localStorage 工具（AI 设置/面试历史/跨页面上下文/引导动作）
│   ├── export.ts                     # 导出工具（下载 Markdown / 复制到剪贴板）
│   ├── interview-core.ts             # 面试核心类型、评分函数、基础题库（fallback）
│   ├── analysis.ts                   # 本地分析函数（AI 不可用时的 fallback）
│   ├── resume-file.ts                # 浏览器端简历文件解析（txt/md/json/docx）
│   └── __tests__/                    # 单元测试
│       ├── interview-core.test.ts
│       ├── resume-file.test.ts
│       └── analysis.test.ts
│
├── data/
│   ├── site.ts                       # 首页静态数据
│   └── interviewer-roles.ts          # 面试官角色定义（温和/压力/深挖）
│
└── types/
    └── mammoth-browser.d.ts

e2e/
└── navigation.spec.ts                # Playwright E2E 测试（14 个用例）
```

### 关键设计决策

**1. AI 请求走服务端 API Route + 用户自带 Key**

所有 AI 请求通过 Next.js API Route 代理。支持两种 Key 来源：
- 服务端 `.env.local`（部署者配置）
- 前端用户通过设置面板填入（存 localStorage，通过请求 header 传递）

用户 Key 优先级高于服务端 Key。前端通过 `fetchWithAiHeaders` 自动注入。

**2. 本地函数作为 Fallback**

`analysis.ts` 中的 `buildReview`、`matchJd`、`polishProject` 在 AI Key 未配置时作为降级方案。基础题库 `frontendFundamentalTopics` 在 AI 返回不足 5 道基础题时作为 fallback。

**3. 面试追问的深度控制**

连贯追问模式下，前端设置 `autoModeMaxDepth = 2` 作为兜底，防止 AI 在同一追问点无限深挖。AI 本身也有 prompt 层面的切题规则（`currentDepth >= 2` 时必须切换），形成双重保障。

**4. 基础题动态生成**

plan API 让 AI 根据目标岗位（`position`）同时生成简历追问点和岗位基础题。如果用户填"后端实习生"，AI 会生成数据库、网络协议等基础题而非前端八股。硬编码的 11 道前端题仅在 AI 生成不足 5 道时作为 fallback。

**5. 产品闭环：智能引导 + 进步追踪**

- **模块间联动**：JD 匹配发现缺失项 → 自动推荐去面试练缺失方向（缺失项作为 `focusContext` 注入 plan prompt）；简历诊断 → 推荐去优化项目或开始面试；面试复盘 → 推荐针对短板再练或回去改简历
- **进步追踪**：每次面试结束自动保存分数和五维度评分，≥2 次记录后展示 SVG 趋势折线图和各维度变化对比
- **个性化训练建议**：复盘时 AI 返回"推荐学习方向"，针对薄弱知识点给出具体学习主题和建议顺序

**6. 组件拆分策略**

模拟面试页拆为：
- `useInterviewSession` hook：所有状态（20+ useState）和业务逻辑
- `InterviewTrainer`：薄 shell，组装子组件和传递 props
- 5 个子组件：`ScoreBoard`、`ReviewPanel`、`QuestionChain`、`InterviewHistory`、`ProgressTracker`

**7. 流式输出**

面试复盘报告使用真 SSE 流式输出（`requestChatStream` → ReadableStream → 前端逐字渲染 + 光标动画）。三个分析页面使用 `useTypewriter` 打字机动画模拟流式效果（因为返回的是结构化 JSON，不适合真 SSE 逐字输出）。

## 本地运行

```bash
npm install
npm run dev
```

构建和测试：

```bash
npm run build
npm run test          # vitest 单元测试
npm run test:e2e      # Playwright E2E（需先 npx playwright install chromium）
npm run lint
```

## AI 配置

**方式一：服务端配置**

新建 `.env.local`：

```env
# DeepSeek（推荐，便宜且中文能力强）
AI_BASE_URL=https://api.deepseek.com/v1
AI_API_KEY=your_key_here
AI_MODEL=deepseek-chat

# 或 OpenAI
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_key_here
AI_MODEL=gpt-4o-mini
```

**方式二：用户自带 Key**

页面右上角点击「设置 API Key」，填入 Key / Base URL / Model 后保存。Key 存储在浏览器 localStorage，通过 HTTPS 请求 header 传递给服务端，不会被持久化到服务器。

| 路径 | 功能 | 无 Key 时行为 |
|---|---|---|
| `/api/resume-review` | 简历诊断 | 降级为本地正则分析 |
| `/api/jd-match` | JD 匹配 | 降级为本地关键词匹配 |
| `/api/project-polish` | 项目优化 | 降级为本地模板改写 |
| `/api/interview-ai` | 模拟面试（plan/round/review） | 返回 503 错误 |

所有 AI 接口均有 IP 频率限制（30 次/分钟）。

## 简历文件支持

| 格式 | 解析方式 |
|---|---|
| `.txt` / `.md` | 直接读取文本 |
| `.json` | JSON.parse 后格式化 |
| `.docx` | mammoth 浏览器端提取纯文本 |
| `.pdf` | 暂不支持，建议复制文本粘贴或转为 .docx |

## 部署

推荐部署到 Vercel。配置环境变量后即可使用全部 AI 功能。未配置服务端 Key 时，用户仍可通过设置面板填入自己的 Key 使用。

PWA 支持：部署后用户可在手机浏览器中"添加到主屏幕"，支持离线访问本地分析功能。

## 可写入简历的项目描述

> AI Career Studio：基于 Next.js 15 + TypeScript 搭建 AI 求职训练工作台，覆盖 JD 匹配、简历诊断、项目优化和多轮模拟面试追问四大模块，通过智能引导卡片和 focusContext 实现模块间训练闭环；设计结构化 AI 输出协议和三种面试官角色（温和/压力/深挖），支持 SSE 流式复盘报告、动态岗位基础题生成和 Web Speech API 语音输入；通过自定义 Hook 管理面试会话状态，拆分 800+ 行组件为 hook + 5 个子组件架构；实现进步追踪 SVG 趋势图、用户自带 API Key 模式、IP 频率限制和 PWA 离线支持；vitest 单元测试 27 个 + Playwright E2E 14 个，husky 提交前自动 lint + type-check。
