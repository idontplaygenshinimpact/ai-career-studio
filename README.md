# CareerPilot / AI Career Studio

[![CI](https://github.com/idontplaygenshinimpact/ai-career-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/idontplaygenshinimpact/ai-career-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

仓库：[GitHub](https://github.com/idontplaygenshinimpact/ai-career-studio) · [Gitee](https://gitee.com/wyyai/ai-career)

面向前端实习 / 校招场景的 AI 能力训练系统。覆盖 JD 匹配、简历诊断、项目经历优化、多轮模拟面试追问、手写题练习和简历版本追踪，所有分析均由真实 AI 驱动，输出结构化评分、风险点、追问链和复盘报告。

项目重点不是做普通 Chatbot 或 AI 表单集合，而是把前端校招准备拆成**诊断 → 训练 → 追问 → 复盘 → 版本迭代**的结构化任务流，并通过**智能引导**在模块之间形成训练闭环。

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

支持粘贴文本或上传文件（`.txt` / `.md` / `.json` / `.docx` / 文本型 `.pdf`），AI 输出结构化评估。

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
- **闭环流转**：优化结果可一键保存为简历版本，并把项目追问点注入模拟面试上下文

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

### 5. 简历版本管理（`/resume-versions`）

跨模块简历版本追踪与综合复盘。

- **自动版本化**：在 JD 匹配、简历诊断、项目优化、模拟面试中提交材料后自动保存版本快照
- **多简历线识别**：通过前 200 字 FNV-1a 32-bit hash 快速匹配 + Levenshtein 编辑距离归一化相似度（≥60%）兜底，自动将不同简历归入独立版本线
- **版本对比**：基于 LCS（最长公共子序列）算法的行级 diff，高亮新增/删除行和分数变化
- **建议聚合**：从三个模块的 AI 输出中提取改进建议，按出现频率去重排序，高频建议自动标记高优
- **综合复盘**：基于 Production Rule System（FactBase + 规则注册 + 按优先级遍历评估）交叉简历诊断分、面试均分、手写通过率三维度，输出投递准备度和优先级排序的下一步建议
- **版本管理**：支持查看简历全文、双版本对比、双击编辑标签、删除版本
- **空状态引导**：无版本时提示用户去其他模块使用简历

### 6. 首页（`/`）

作品集展示页，包含能力矩阵、工作流设计、技术栈和核心数据指标。

### 7. 全局功能

- **用户自带 API Key**：导航栏设置面板，填入 Key/BaseURL/Model 后存 localStorage，所有请求自动通过 header 传递，优先级高于服务端 `.env.local`
- **AI Base URL 安全校验**：服务端统一限制自定义 Base URL 必须是公开 HTTPS 地址，拒绝 localhost、内网 IP、本机地址和携带凭据的 URL，降低 SSRF 风险
- **PWA 支持**：manifest.json + 分层 Service Worker 缓存（API 不缓存、Next 静态资源 cache-first、页面 network-first）+ SVG 图标，支持安装到桌面和离线访问
- **错误边界**：全局 error.tsx（带重试按钮）+ 每个页面独立的骨架屏 loading
- **无障碍**：导航栏 aria-label、设置面板 role="dialog"、语音按钮 aria-label
- **API 频率限制**：所有 AI 接口基于 Sliding Window Log + LRU 淘汰（1024 IP 上限）做 30 次/分钟频率控制（单实例内存方案，分布式需 Redis）

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | Next.js 15（App Router） |
| 语言 | TypeScript（strict mode） |
| 样式 | Tailwind CSS 3 |
| AI 接口 | OpenAI-compatible Chat Completions API（支持 SSE 流式） |
| 文件解析 | mammoth（浏览器端 .docx 解析）+ pdfjs-dist（文本型 PDF 解析） |
| 语音识别 | Web Speech API |
| 单元测试 | vitest（162 个测试） |
| E2E 测试 | Playwright（59 个测试） |
| 代码质量 | husky + lint-staged（提交前自动 eslint + tsc） |
| PWA / 性能监控 | Service Worker + Web App Manifest + Vercel Speed Insights |

## 工程化与面试材料

| 文档 | 说明 |
|---|---|
| [`docs/performance-report.md`](docs/performance-report.md) | 性能优化证据链：路由体积、动态加载、优化前后估算、Vercel 部署后验证项 |
| [`docs/bundle-analysis.md`](docs/bundle-analysis.md) | Bundle 拆分分析：共享 chunk、页面 JS、CodeMirror / PDF 解析 / PDF 导出按需加载 |
| [`docs/prompt-design.md`](docs/prompt-design.md) | AI Prompt 设计：`plan / round / review` 三阶段协议、JSON schema、badcase 和稳定性策略 |
| [`docs/interview-faq.md`](docs/interview-faq.md) | 秋招面试 FAQ：SSE、Web Worker 沙箱、LCS diff、AI 输出稳定性、无后端取舍和 Vercel 部署注意点 |

当前验证结果：`npm run lint`、`npx tsc --noEmit`、`npm test`（162 tests）、`npm run test:e2e`（59 tests）和 `npm run build` 均已通过。

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
│   ├── coding-practice/
│   │   └── page.tsx                  # 手写 / 算法练习页（动态加载轻量 IDE）
│   ├── resume-versions/
│   │   ├── page.tsx                  # 简历版本管理页
│   │   └── loading.tsx
│   └── api/
│       ├── interview-ai/route.ts     # 模拟面试 AI 接口（plan/round/review + SSE 流式）
│       ├── resume-review/route.ts    # 简历诊断 AI 接口
│       ├── jd-match/route.ts         # JD 匹配 AI 接口
│       ├── project-polish/route.ts   # 项目优化 AI 接口
│       ├── code-review/route.ts      # 手写题 AI 代码审查接口
│       └── mock-ai/route.ts          # Legacy 兼容接口
│
├── components/
│   ├── InterviewTrainer.tsx          # 模拟面试主组件（薄 shell，组装子组件）
│   ├── CodingWorkbench.tsx           # 手写练习主组件（纯 UI 壳，状态由 hook 管理）
│   ├── DynamicCodeEditor.tsx         # CodeMirror 动态加载包装（next/dynamic + ssr: false）
│   ├── TrainingDashboard.tsx         # 训练数据看板（SVG 雷达图 + 通过趋势）
│   ├── ResumeVersionsWorkbench.tsx  # 简历版本管理主组件（时间线 + 对比 + 综合复盘）
│   ├── JdMatchWorkbench.tsx          # JD 匹配工作台（含智能引导）
│   ├── ProjectPolishWorkbench.tsx    # 项目优化工作台（含打字机动画）
│   ├── ResumeReviewWorkbench.tsx     # 简历诊断工作台（含智能引导 + 打字机动画）
│   ├── SiteNav.tsx                   # 全局导航栏（含 AI 设置入口）
│   ├── AiSettingsPanel.tsx           # AI Key 设置面板（模态框）
│   ├── NextActions.tsx               # 智能引导卡片（跨页面复用）
│   ├── ServiceWorkerRegister.tsx     # SW 注册组件
│   ├── coding/                       # 手写练习子组件（从 CodingWorkbench 拆出）
│   │   ├── types.ts                  # 类型、常量、格式化工具
│   │   ├── storage.ts                # localStorage 读写（代码/快照/收藏/提交记录）
│   │   ├── test-utils.ts             # 自定义测试合并逻辑
│   │   ├── ChallengeList.tsx         # 题目列表侧栏（memo）
│   │   ├── CodingStats.tsx           # 统计卡片（memo）
│   │   ├── CustomTestPanel.tsx       # 自定义测试面板
│   │   ├── SnapshotPanel.tsx         # 代码快照（memo）
│   │   ├── AttemptHistory.tsx        # 提交记录（memo）
│   │   ├── SandboxResultPanel.tsx    # 运行结果面板（memo）
│   │   └── AiCodeReviewPanel.tsx     # AI 审查结果面板（memo）
│   └── interview/                    # 模拟面试子组件
│       ├── ScoreBoard.tsx            # 实时评分面板（AI Score / 参考分标注）
│       ├── ReviewPanel.tsx           # 复盘报告面板（SSE 流式 + 学习建议 + 引导）
│       ├── InterviewStagePanel.tsx   # 面试状态机可视化面板
│       ├── QuestionChain.tsx         # 追问链列表
│       ├── InterviewHistory.tsx      # 面试历史记录（展开/下载/删除）
│       └── ProgressTracker.tsx       # 进步追踪（SVG 趋势图 + 维度对比）
│
├── hooks/
│   ├── useAiRequest.ts               # AI 请求统一 Hook（取消/超时/重试/错误分类）
│   ├── useCodingWorkbench.ts         # 手写练习全部状态和业务逻辑
│   ├── useInterviewSession.ts        # 模拟面试状态（旧版，保留用于对比）
│   ├── useTypewriter.ts              # 打字机动画（单文本 + 列表）
│   └── useSpeechRecognition.ts       # 语音识别（Web Speech API）
│
├── lib/
│   ├── ai-client.ts                  # 共享 AI 请求工具（非流式 + 流式 + debug 元数据）
│   ├── ai-config-header.ts           # 从请求 header 提取用户 AI 配置
│   ├── fetch-ai.ts                   # 前端 AI 请求封装（取消/超时/重试/错误分类 + 自动注入 Key）
│   ├── rate-limit.ts                 # IP 频率限制（Sliding Window Log + LRU 淘汰，30 次/分钟）
│   ├── storage.ts                    # localStorage 工具（AI 设置/面试历史/跨页面上下文/引导动作）
│   ├── export.ts                     # 导出工具（下载 Markdown / 复制到剪贴板）
│   ├── interview-core.ts             # 面试核心类型、评分函数、基础题库（fallback）
│   ├── analysis.ts                   # 本地分析函数（AI 不可用时的 fallback）
│   ├── resume-file.ts                # 浏览器端简历文件解析（txt/md/json/docx/文本型 pdf）
│   ├── resume-versions.ts           # 简历版本管理（指纹归类 + LCS diff + 建议聚合）
│   ├── comprehensive-advice.ts      # 综合复盘引擎（Production Rule System，FactBase + 规则注册 + 遍历评估）
│   └── __tests__/                    # 单元测试
│       ├── interview-core.test.ts
│       ├── resume-file.test.ts
│       ├── resume-versions.test.ts
│       └── analysis.test.ts
│
├── data/
│   ├── site.ts                       # 首页静态数据
│   ├── dimensions.ts                 # 五维能力定义（共享常量，避免重复）
│   ├── resume-version-types.ts      # 简历版本/版本线/建议类型定义
│   ├── interviewer-roles.ts          # 面试官角色定义（温和/压力/深挖）
│   └── coding-challenges.ts          # 手写/算法题库（91 题）
│
└── types/
    └── mammoth-browser.d.ts

e2e/
├── navigation.spec.ts                # Playwright E2E 测试（页面导航 + 表单）
├── core-flows.spec.ts                # 核心流程测试（简历诊断 + 手写练习 + 面试结构）
├── ide-and-dashboard.spec.ts         # 轻量 IDE + 看板 + 负向路径测试
├── enhanced-coverage.spec.ts         # 增强覆盖：项目优化闭环 + 面试状态机 + 错误边界 + 移动端响应式
└── resume-versions.spec.ts           # 简历版本管理页测试
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

连贯追问模式下，前端设置 `AUTO_MODE_MAX_DEPTH = 3` 作为兜底，防止 AI 在同一追问点无限深挖。AI 本身也有 prompt 层面的切题规则（`currentDepth >= 2` 时倾向切换），形成双重保障。

**4. 基础题动态生成**

plan API 让 AI 根据目标岗位（`position`）同时生成简历追问点和岗位基础题。如果用户填"后端实习生"，AI 会生成数据库、网络协议等基础题而非前端八股。硬编码的 11 道前端题仅在 AI 生成不足 5 道时作为 fallback。

**5. 产品闭环：智能引导 + 进步追踪**

- **模块间联动**：JD 匹配发现缺失项 → 自动推荐去面试练缺失方向（缺失项作为 `focusContext` 注入 plan prompt）；简历诊断 → 推荐去优化项目或开始面试；项目优化 → 保存为简历版本并带追问点进入模拟面试；面试复盘 → 推荐针对短板再练或回去改简历
- **进步追踪**：每次面试结束自动保存分数和五维度评分，≥2 次记录后展示 SVG 趋势折线图和各维度变化对比
- **个性化训练建议**：复盘时 AI 返回"推荐学习方向"，针对薄弱知识点给出具体学习主题和建议顺序

**6. 简历版本管理与综合复盘**

- **自动版本化**：用户在 JD 匹配、简历诊断、项目优化、模拟面试中提交材料时，自动保存版本快照并关联当次 AI 分析结果（评分 + 改进建议）
- **多简历线归类**：通过前 200 字 FNV-1a 32-bit hash 快速匹配 + Levenshtein 编辑距离归一化相似度（Wagner-Fischer DP + 滚动数组，≥60%）兜底，自动将不同简历归入独立版本线
- **版本去重**：相同文本 + 相同来源不创建新版本，只更新评分和建议
- **LCS 行级对比**：使用最长公共子序列动态规划算法比对两个版本的简历文本，正确处理重复行和行位移
- **综合复盘引擎**：基于 Production Rule System（FactBase 收集 → ReadinessRule/ActionRule 注册 → 按优先级遍历评估），交叉简历诊断分、面试均分、手写通过率三维度，输出投递准备度（可以投递/基本准备好/需要继续打磨/建议先集中训练）和优先级排序的下一步建议

**7. 状态管理与面试状态机**

模拟面试页使用 Zustand 管理会话状态，把面试拆成 `简历输入 → AI 规划 → 动态追问 → 手写穿插 → 流式复盘` 五个阶段：
- `interview-store.ts`：按 Session Config / Progress / Scoring / Review 分区维护状态，导出 `selectRound`、`selectAverageScore`、`selectReportMarkdown` 等派生选择器，避免组件重复计算。
- `InterviewStagePanel`：把面试状态机可视化展示为阶段面板，实时标记 waiting / active / done / error，并显示追问节点数、当前深挖次数、回答轮次和基础题覆盖度。
- `InterviewTrainer`：薄 shell，组装面试表单、代码作答、评分、复盘和追问链；面试业务推进集中在 store 的 action 中。
- 子组件：`ScoreBoard`、`ReviewPanel`、`QuestionChain`、`InterviewStagePanel`、`InterviewHistory`、`ProgressTracker`。

**8. 轻量在线 IDE 与手写题沙箱**

手写练习页以 CodeMirror + Web Worker 组成轻量在线 IDE，支持题目收藏、自定义测试、代码快照、提交记录、控制台输出和 AI 失败用例讲解：
- Worker 隔离用户代码，避免死循环阻塞主线程。
- 支持超时、CPU heartbeat、日志捕获、测试结果回传和内存估算。
- 自定义测试会在官方测试之后执行，提交记录保存通过数、耗时、CPU 时间和错误信息。
- AI 代码审查可结合失败用例、console 日志和自定义测试给出定位建议。
- 当模拟面试追问命中手写 / 算法题时，面试页会自动切到代码作答模式，运行结果会写回本轮回答，进入后续 AI 评分和复盘链路。

**9. AI 请求任务控制**

前端 `fetchWithAiHeaders` 不再只是注入用户 Key，而是提供 AI 请求控制能力：
- `AbortController` 取消请求，避免用户切换题目或重复点击后旧请求回写状态。
- 超时控制和错误分类（取消 / 超时 / 网络异常），便于给出明确 UI 文案。
- 对 429 / 5xx 以及网络异常支持有限重试，并通过 `onRetry` 把重试状态反馈到界面。

**10. 流式输出**

面试复盘报告使用真 SSE 流式输出（`requestChatStream` → ReadableStream → 前端逐字渲染 + 光标动画）。三个分析页面使用 `useTypewriter` 打字机动画模拟流式效果（因为返回的是结构化 JSON，不适合真 SSE 逐字输出）。

## 前端复杂度亮点

- **复杂状态流**：用 Zustand + selector 管理多阶段面试状态机，用 `useCodingWorkbench` 管理轻量 IDE 全部状态，把业务逻辑从 UI 壳中彻底分离。
- **统一 AI 请求控制**：`useAiRequest` Hook 统一管理 JD 匹配、简历诊断、项目优化、代码审查等 AI 请求状态（loading / error / status / cancel / retry），避免每个页面重复实现请求逻辑；`fetchWithAiHeaders` 覆盖用户 Key 注入、429/5xx 重试、超时和外部取消。
- **组件工程化**：手写练习页从 700+ 行单文件拆为 `useCodingWorkbench` hook + 7 个 `memo` 子组件 + 3 个工具模块，主组件只做 UI 组装。
- **性能优化**：CodeMirror 通过 `DynamicCodeEditor` 动态加载（`next/dynamic + ssr: false`），模拟面试页 First Load JS 约 149 kB（较直接打包编辑器依赖估算减少约 50%）。
- **复杂交互**：支持语音输入、SSE 流式复盘、代码编辑器作答、手写题自动识别、自定义测试、快照恢复、提交记录和运行测试，覆盖表单、流、Worker、编辑器、本地持久化等多类前端交互。
- **训练数据看板**：SVG 五维能力雷达图 + 手写题通过趋势 + 7 项训练指标（含简历版本数），形成「训练 → 反馈 → 再训练」闭环。
- **简历版本管理**：FNV-1a 32-bit hash + Levenshtein 编辑距离归一化相似度自动归类多简历线，LCS 动态规划行级 diff，跨模块自动保存版本并关联评分和建议。
- **综合复盘引擎**：Production Rule System 交叉简历/面试/手写三维度，区分"未评估"和"评估为低分"，输出投递准备度和优先级建议。
- **稳定性设计**：AI 请求走 API Route 代理，结合用户自带 Key、AbortController 取消、超时、重试、错误分类、Zod 校验、IP 频率限制、本地 fallback 和模型 JSON normalize，避免前端直接裸调模型。

## 本地运行

要求 Node.js ≥ 22.13（`pdfjs-dist` / `lint-staged` 等依赖的 engine 要求，CI 亦使用 Node 22）。

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

所有 AI 接口均有 Sliding Window Log 频率限制（30 次/分钟，单实例内存方案）。

## 简历文件支持

| 格式 | 解析方式 |
|---|---|
| `.txt` / `.md` | 直接读取文本 |
| `.json` | JSON.parse 后格式化 |
| `.docx` | mammoth 浏览器端提取纯文本 |
| `.pdf` | pdfjs-dist 浏览器端提取文本；扫描件 / 图片 PDF 建议复制文本粘贴或转为 .docx |

## 部署

推荐部署到 Vercel。配置环境变量后即可使用全部 AI 功能。未配置服务端 Key 时，用户仍可通过设置面板填入自己的 Key 使用。

PWA 支持：部署后用户可在手机浏览器中"添加到主屏幕"，支持离线访问本地分析功能。

### Vercel 部署前检查

1. 在 Vercel Project Settings 中配置：`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。
2. 本地确认 `npm run build` 通过，并记录 route size 输出。
3. 部署后访问 `/mock-interview`，验证 `review` 流式复盘可以正常输出。
4. 如果不希望服务端持有 Key，可以不配置 `AI_API_KEY`，由用户在页面右上角设置面板填入自己的 Key。
5. 部署后在 Vercel 控制台查看 Speed Insights 指标，并补一份 Lighthouse 或 Network 截图，和 `docs/performance-report.md` 一起作为性能优化证据。

## 可写入简历的项目描述

> CareerPilot / AI Career Studio：基于 Next.js 15 + TypeScript 搭建面向前端校招的 AI 能力训练系统，覆盖 JD 匹配、简历诊断、项目优化、多轮模拟面试、手写题练习和简历版本管理七大模块，形成「诊断 - 训练 - 复盘 - 迭代」闭环；设计 `plan / round / review` 三阶段 AI 面试协议和五阶段状态机，通过 Zustand selector 管理面试状态，通过 `useCodingWorkbench` 管理轻量 IDE 状态；实现项目优化结果保存为简历版本并带追问点进入模拟面试，实现简历版本自动归类（前 200 字指纹 hash + 相似度比对）、LCS 行级 diff 和纯规则引擎综合复盘（交叉简历/面试/手写三维度输出投递准备度）；将手写练习页从 700+ 行单文件拆为 hook + 7 个 memo 子组件，对 CodeMirror 做动态加载（面试页首屏约 149 kB，较直接打包编辑器依赖估算减少约 53%）；封装 `useAiRequest` / `fetchWithAiHeaders` 统一 AI 请求的用户 Key 注入、取消、超时、429/5xx 重试和错误分类，并对自定义 AI Base URL 做 HTTPS / 内网地址校验以降低 SSRF 风险；实现分层 Service Worker 缓存和 Vercel Speed Insights 性能监控；vitest 162 个单测 + Playwright 59 个 E2E（含负向路径和错误边界），GitHub Actions CI 自动执行 lint + type-check + 单元测试，husky 提交前自动 lint + type-check。

## License

[MIT](LICENSE) © idontplaygenshinimpact
