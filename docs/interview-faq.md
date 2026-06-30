# Interview FAQ

这份文档用于准备秋招面试中围绕 CareerPilot / AI Career Studio 可能出现的追问。回答重点是：不夸大项目边界，明确当前实现、取舍原因和可扩展方案。

## 1. 这个项目是不是 AI 套壳？

不是简单把输入框接到大模型。项目把求职准备拆成「诊断 → 训练 → 追问 → 复盘 → 版本迭代」的任务流，并在工程层做了三类封装：

- **协议层**：`/api/interview-ai` 拆成 `plan / round / review` 三阶段，分别负责面试计划、逐轮追问评分、最终复盘。
- **稳定性层**：`fetchWithAiHeaders` 统一处理用户 Key 注入、超时、取消、429/5xx 重试和错误分类。
- **产品闭环层**：JD 匹配、项目优化、模拟面试和简历版本管理之间通过本地上下文和版本记录串联。

面试表达时可以说：模型能力来自外部 API，项目重点是 **LLM 应用层协议设计、复杂前端状态管理和工程化可靠性**。

## 2. 为什么用 SSE，而不是 WebSocket？

模拟面试复盘是典型的服务端向客户端单向增量输出场景：服务端持续生成文本，客户端逐字展示，不需要客户端和服务端高频双向通信。

选择 SSE / ReadableStream 的原因：

- 基于 HTTP，请求链路简单，适合部署在 Vercel / Serverless 场景。
- 更贴近 LLM token streaming 模式，服务端只需要把模型 delta 转成文本流。
- 相比 WebSocket，不需要维护连接状态、心跳和双向消息协议。

当前实现位置：

- `src/lib/ai-client.ts`：`requestChatStream` 解析 OpenAI-compatible `data: ...` 流。
- `src/app/api/interview-ai/route.ts`：`review` action 在 `stream=true` 时返回 `ReadableStream`。
- `ReviewPanel` 侧负责逐步展示复盘文本。

## 3. SSE 中断或模型流异常怎么办？

当前版本的处理边界：

- 服务端会检查上游响应状态，非 2xx 返回明确错误。
- 上游流中无法解析的 chunk 会跳过，避免单个异常 chunk 破坏整段输出。
- 前端 AI 请求层有超时、取消和错误分类能力。

如果要继续增强，可以做：

1. 前端捕获 reader 异常后展示「重新生成复盘」。
2. 服务端为 chunk 增加序号，前端记录最后接收位置。
3. 如果模型或平台支持 `Last-Event-ID`，可以做断点续传。
4. 失败时退化到非流式 `review` JSON 接口，至少保证用户拿到复盘结果。

面试中不要说已经实现断点续传；可以说当前实现了基础流式输出和错误兜底，断线续传是下一步增强。

## 4. Web Worker 沙箱安全吗？

`src/lib/sandbox.ts` 使用 Web Worker 执行手写题代码，目标是隔离主线程和收集运行结果，而不是提供浏览器级强安全沙箱。

当前实现能力：

- 用户代码在 Worker 中运行，不能直接访问主线程 DOM。
- 主线程通过 `postMessage` 获取测试结果、日志、CPU 时间和内存估算。
- 设置 15s 总超时，避免死循环长期阻塞。
- 通过 heartbeat 监控 CPU 时间，超过阈值时主动结束。
- 捕获 `console.log/error/warn`，用于失败用例解释。

边界和风险：

- Worker 不是强安全容器，仍可能消耗 CPU / 内存。
- 代码通过 Blob 动态生成，生产环境需要注意 CSP 策略。
- 无法完全限制所有 JS 运行行为。

可扩展方案：

- 更严格的 CSP。
- iframe `sandbox` 隔离。
- 服务端容器 / isolate 执行代码。
- 对题目输入规模和执行时间做更强限制。

## 5. LCS diff 的复杂度是多少？大文件怎么办？

`src/lib/resume-versions.ts` 中的 `diffLines` 是行级 LCS 动态规划。

- 时间复杂度：`O(m * n)`
- 空间复杂度：`O(m * n)`
- 适用场景：简历通常是 1-2 页，行数较少，当前复杂度可接受。

如果扩展到大文档，可以做：

1. 使用滚动数组降低空间复杂度。
2. 使用 Myers diff 等更适合文本 diff 的算法。
3. 先按段落分块，再做块内行级 diff。
4. 放到 Web Worker 中计算，避免阻塞主线程。
5. 对相同 fingerprint 或相似度极高的版本直接跳过完整 diff。

## 6. 简历版本为什么用 fingerprint + 相似度？

项目需要自动判断用户提交的简历属于已有版本线还是新简历线。

当前策略：

- 先取前 200 字去空白作为 normalized text。
- 计算 FNV-1a 32-bit hash 做快速匹配（offset basis 2166136261, prime 16777619）。
- fingerprint 不一致时，用 Levenshtein 编辑距离归一化相似度兜底（Wagner-Fischer DP + 滚动数组，空间 O(min(m,n))）。
- 相似度达到 60% 认为属于同一条简历线。

这个策略的取舍：

- 优点：实现轻量、无需服务端、对简历微调有容错、Levenshtein 对插入/删除/替换都有正确度量。
- 缺点：如果用户大幅调整简历开头，可能被识别成新线；前 200 字窗口外的改动不影响指纹。
- 可扩展：引入 SimHash 做近似检测，或用 TF-IDF cosine 做全文相似度。

## 7. 为什么没有做数据库和用户系统？

当前项目定位是前端秋招项目，核心目标是展示复杂前端交互、AI 应用工程化和测试体系，所以优先实现：

- 多阶段面试状态机
- SSE 流式复盘
- CodeMirror + Worker 手写题沙箱
- 简历版本 diff
- 单测 / E2E / CI

本地存储可以覆盖个人训练工具的 MVP 场景，也避免在求职项目中把精力分散到账号、权限、部署成本上。

如果要扩展成全栈版本：

| 表 | 作用 |
|---|---|
| `users` | 用户基础信息和认证映射 |
| `resume_lines` | 简历版本线 |
| `resume_versions` | 简历版本文本、来源、评分、建议 |
| `interview_sessions` | 面试配置、轮次、分数、复盘 |
| `coding_attempts` | 手写题提交记录、运行结果、失败原因 |
| `ai_request_logs` | 模型、token、耗时、错误，用于成本和质量分析 |

技术选型可以是 Supabase / PostgreSQL + RLS，或 Next.js API Route + Prisma。

## 8. AI JSON 输出不稳定怎么办？

当前已有措施：

- 服务端请求参数用 Zod 校验。
- prompt 明确要求「只输出 JSON，不要 Markdown」。
- `parseModelJson` 会去掉常见代码块包裹后再解析。
- AI 不可用时，部分模块有本地 fallback。
- 前端请求层有超时、重试和错误分类。

可继续增强：

1. 使用 JSON Schema / function calling / structured output。
2. 解析失败后追加 repair prompt 自动修复一次。
3. 记录 badcase，形成 prompt 回归样本。
4. 对关键字段做 Zod 二次校验，不合法时降级默认值。

## 9. 性能优化主要做了什么？

核心思路是避免把重依赖放进首屏关键路径。

- CodeMirror 通过 `next/dynamic` 和 `ssr: false` 动态加载。
- `CodingWorkbench` 整体 lazy load，避免 IDE 影响普通页面。
- `pdfjs-dist` 只在上传 PDF 时动态加载。
- `html2canvas-pro` 和 `jspdf` 只在导出 PDF 时动态加载。
- 构建结果中 `/mock-interview` First Load JS 约 149 kB，未把 CodeMirror 放进首屏。

面试中可以强调：优化不是泛泛而谈，而是针对编辑器、PDF 解析、PDF 导出这类重依赖做按需加载，并用 `next build` 和 bundle report 验证。

## 10. Vercel 部署需要注意什么？

- 配置环境变量：`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。
- 如果不配置服务端 Key，用户仍可在前端设置面板填入自己的 Key。
- 自定义 AI Base URL 会在服务端校验：必须是公开 HTTPS 地址，不能是 localhost、内网 IP、本机地址或携带用户名密码的 URL，避免 API Route 被滥用成 SSRF 代理。
- 流式接口依赖平台对 `ReadableStream` 的支持，部署后需要实际验证 `/mock-interview` 复盘流式输出。
- Serverless 环境下内存 Map 限流只适合单实例轻量防刷，不等价于分布式限流。
- Vercel Speed Insights 已接入根布局，部署后可在 Vercel 控制台查看真实用户性能指标。
- 生产环境不要提交 `.env.local`。

## 11. Service Worker 为什么要分层缓存？

统一缓存策略容易误缓存不该缓存的数据。这个项目里 AI API 请求包含简历、回答、代码等用户输入，所以 `/api/*` 必须不缓存；`/_next/static/*` 是带 hash 的构建产物，适合 cache-first；页面路由则用 network-first，优先拿最新页面，离线时再回退缓存。

面试回答：

> 我把缓存策略按资源类型拆分：API 不缓存，避免隐私数据和 AI 响应被 SW 缓存；Next 静态资源 cache-first，提高重复访问速度；页面 network-first，保证在线时更新及时、离线时可用。

## 12. 简历相似度用的什么算法？为什么不用 SimHash？

`src/lib/resume-versions.ts` 中的 `calcSimilarity` 使用 Levenshtein 编辑距离（Wagner-Fischer DP）做归一化相似度：

```
similarity = 1 - editDistance(a, b) / max(len(a), len(b))
```

- 时间复杂度：O(m × n)，m 和 n 是两段 normalized text 的长度（最长 200 字）。
- 空间复杂度：O(min(m, n))，使用滚动数组只保留两行 DP。
- 优点：对插入、删除、替换三种编辑操作都有正确度量，不像简单的位置匹配那样对插入敏感。
- 适用场景：简历前 200 字窗口内的比较，规模小，DP 开销可忽略。

为什么不用 SimHash / MinHash：

- SimHash 适合大规模文本去重（搜索引擎级别），需要 shingle 切分和位运算，对 200 字窗口收益不大。
- Levenshtein 在小窗口下更直观、可解释、面试时容易手推公式。
- 如果扩展到全文相似度或海量简历库，可以考虑 SimHash + Hamming 距离做第一轮筛选，Levenshtein 做第二轮精确比较。

`calcFingerprint` 使用 FNV-1a 32-bit hash（offset basis 2166136261, prime 16777619），选择原因是实现简单、分布均匀、碰撞率低于朴素乘法 hash，且面试时能说出算法名称和参数。

## 13. 综合复盘的"规则引擎"怎么实现的？

`src/lib/comprehensive-advice.ts` 采用 Production Rule System 模式：

1. **FactBase 构建**：`buildFactBase()` 从 localStorage 收集 resumeScore、interviewAvg、codingPassRate、unresolvedCount、interviewCount、attemptCount、recentFailureIds，构造不可变事实对象。

2. **规则注册**：
   - `readinessRules: ReadinessRule[]`：按 priority 降序注册 5 条规则（no-data / can-deliver / basic-ready / needs-polish / fallback），每条有 `condition: (facts) => boolean` 和对应的 `readiness` 值。
   - `actionRules: ActionRule[]`：注册 8 条建议规则，每条有 `condition`、`priority`、`category` 和 `action`（支持字符串或函数，函数可访问 facts 动态生成文案）。

3. **评估执行**：
   - `evaluateReadiness(facts)`：按 priority 降序遍历 readinessRules，返回第一条匹配的 readiness。
   - `evaluateActions(facts)`：遍历所有 actionRules，收集全部匹配项，按 priority 升序排列。无匹配时返回默认兜底建议。

扩展方式：只需向 readinessRules 或 actionRules 数组追加新规则，不需要修改 evaluate 逻辑。

与传统 if-else 的区别：规则和执行逻辑解耦，规则可以独立测试（传入 mock facts），新增维度只需加规则不改流程。

## 14. 限流 30 次/分钟在 Vercel Serverless 怎么生效？

`src/lib/rate-limit.ts` 使用 Sliding Window Log 算法 + LRU 淘汰：

- 每个 IP 维护窗口内（60s）的请求时间戳数组。
- 每次请求清理过期时间戳，窗口内超过 30 次则拒绝。
- IP 条目上限 1024，超过时按 LRU 淘汰最久未访问的 IP。

**单实例限制**：这个实现是进程内 Map，Vercel Serverless 每个函数实例独立内存，多实例各自计数。这意味着：

- 单实例场景（开发环境、低流量部署）有效。
- 多实例高并发场景下，同一 IP 的请求分散到不同实例，限流效果被稀释。
- IP 从 `x-forwarded-for` 取首个值，理论上可被伪造（但 Vercel 会覆盖该 header）。

**分布式环境方案**：

1. Upstash Redis + `@upstash/ratelimit`：Serverless 友好，按 HTTP 调用计费。
2. Vercel KV（底层也是 Upstash Redis）。
3. Cloudflare Workers + Durable Objects。
4. 在 Vercel Edge Middleware 层做限流，比 API Route 更早拦截。

面试回答时主动说明当前是单实例内存方案，并给出分布式升级路径，不要等面试官追问。
