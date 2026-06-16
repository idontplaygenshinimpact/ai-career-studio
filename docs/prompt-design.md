# Prompt Design Notes

本文档记录 CareerPilot / AI Career Studio 的 AI 面试协议、Prompt 约束和稳定性策略，用于说明项目不是简单 Chatbot，而是围绕校招训练场景设计的结构化 LLM 工作流。

## 设计目标

项目把模拟面试拆成三个阶段：

| 阶段 | API action | 目标 | 输出形态 |
|---|---|---|---|
| 面试计划 | `plan` | 从真实简历和目标岗位中生成追问计划 | JSON |
| 单轮追问 | `round` | 根据候选人回答生成下一问和评分 | JSON |
| 最终复盘 | `review` | 基于完整轨迹生成复盘报告 | JSON 或 Stream |

设计重点：

- **结构化**：让模型输出稳定字段，方便前端状态机消费。
- **可控追问**：限制追问边界，避免模型编造简历不存在的经历。
- **真实节奏**：项目/实习深挖、基础题穿插、手写题识别，不做单轮问答。
- **可复盘**：每轮都有评分维度，最终报告引用具体回答。

## 1. Plan Prompt：生成面试计划

入口：`src/app/api/interview-ai/route.ts` → `handlePlan`

### 输入

- `position`：目标岗位，默认「前端实习生」。
- `resumeText`：用户上传或粘贴的真实简历。
- `focusContext`：来自 JD 匹配、项目优化等模块的重点追问方向。
- `interviewerRole`：温和、压力、技术深挖等面试官角色。

### 输出字段

```json
{
  "summary": "基于简历生成的整体面试计划说明",
  "resumeTopics": [
    {
      "id": "resume-project-1",
      "focus": "项目中的状态管理设计",
      "dimension": "项目深度",
      "question": "你在这个项目里为什么选择这种状态管理方式？",
      "boundary": "只围绕简历中出现的项目和技术，不追问未提及的后端系统"
    }
  ],
  "fundamentalTopics": [
    {
      "id": "fundamental-event-loop",
      "focus": "基础：事件循环",
      "dimension": "技术基础",
      "question": "你能结合一个异步请求场景讲一下事件循环吗？",
      "boundary": "不要求展开到浏览器源码实现"
    }
  ]
}
```

### 关键约束

- `resumeTopics` 只能来自 `resumeText`，不允许编造项目。
- 每个追问点必须给出 `boundary`，明确不该越界到哪里。
- `fundamentalTopics` 根据 `position` 动态生成，不固定为前端题。
- 手写题从内置题库中选择，避免模型临场编题导致前端无法匹配。

### 失败兜底

- 如果基础题数量不足 5 道，降级使用 `frontendFundamentalTopics`。
- 如果模型 JSON 解析失败，服务端返回明确错误，前端展示失败状态。

## 2. Round Prompt：生成下一问和评分

入口：`src/app/api/interview-ai/route.ts` → `handleRound`

### 输入

- 当前岗位和面试模式。
- 简历文本。
- 候选人上一轮回答。
- 当前追问点和深挖深度。
- 已覆盖 focus。
- 下一候选 topic。
- 历史轮次。

### 输出字段

```json
{
  "id": "round-2",
  "focus": "项目性能优化",
  "dimension": "技术深度",
  "question": "你刚才提到做了动态加载，能具体说说怎么验证收益的吗？",
  "boundary": "只追问前端性能指标，不展开到服务端压测",
  "feedback": "上一轮回答能说明方案，但量化指标不足",
  "followUp": "补充优化前后的 bundle 数据",
  "trigger": "来自候选人回答中的 CodeMirror 动态加载",
  "answerStandard": "需要覆盖优化前问题、实现方式、验证指标、取舍",
  "shouldSwitchFocus": false,
  "switchReason": "当前方向仍有可深挖点",
  "answerScore": {
    "total": 78,
    "accuracy": 24,
    "structure": 20,
    "depth": 18,
    "riskHandling": 8,
    "reviewMindset": 8,
    "comment": "方案正确，但缺少异常场景和数据验证。"
  }
}
```

### 评分维度

| 字段 | 分值 | 含义 |
|---|---:|---|
| `accuracy` | 0-30 | 技术准确性 |
| `structure` | 0-25 | 表达结构 |
| `depth` | 0-25 | 项目深度 |
| `riskHandling` | 0-20 | 异常和边界意识 |
| `reviewMindset` | 0-15 | 复盘和改进意识 |

### 节奏控制

Prompt 中约束真实一面节奏：

1. 先集中深挖项目 / 实习经历。
2. 再集中穿插基础题。
3. 适时插入 1-2 道手写题。
4. 同一 focus 深挖 2-3 轮后倾向切换。

前端也有 `AUTO_MODE_MAX_DEPTH = 3` 作为兜底，防止同一方向无限追问。

## 3. Review Prompt：生成复盘报告

入口：`src/app/api/interview-ai/route.ts` → `handleReview`

### 非流式输出

非流式模式要求 JSON，便于前端结构化展示：

```json
{
  "overallComment": "整体评价",
  "strengths": ["具体优势"],
  "weaknesses": ["具体短板"],
  "nextSteps": ["可执行动作"],
  "learningPaths": ["推荐学习方向"],
  "interviewReadiness": "需打磨"
}
```

### 流式输出

流式模式输出纯文本，用于逐字渲染复盘体验：

- 总体评价
- 强项
- 短板
- 下一步
- 推荐学习方向
- 面试可投递性判断

选择流式纯文本的原因：结构化 JSON 不适合 token-by-token 展示，纯文本更贴合复盘报告阅读体验。

## 4. 稳定性策略

### 输入校验

`src/lib/validations.ts` 使用 Zod 校验请求参数，避免无效 body 直接进入模型调用。

### 输出解析

`parseModelJson` 会先去除常见 Markdown code fence，再做 JSON parse。

### 降级策略

- JD 匹配、简历诊断、项目优化在无 Key 时可以走本地规则 fallback。
- 模拟面试依赖真实 AI；无 Key 时返回 503，并提示用户配置 Key。
- 面试基础题生成不足时使用本地题库 fallback。

### 请求控制

前端 `fetchWithAiHeaders` 提供：

- 用户 Key / Base URL / Model 注入。
- 超时控制。
- 外部取消。
- 429 / 5xx 有限重试。
- 网络异常、超时、取消的错误分类。

## 5. Badcase 与修复策略

| Badcase | 表现 | 当前处理 | 后续增强 |
|---|---|---|---|
| 模型输出 Markdown 包裹 JSON | ```json 包住结果 | `stripCodeFence` 后解析 | 引入 structured output |
| 模型编造简历项目 | 追问简历未出现经历 | Prompt 明确禁止，并要求 boundary | 增加事实引用字段和前端核验 |
| 基础题数量不足 | 面试计划不完整 | fallback 到本地基础题库 | 对题目分布做 schema 校验 |
| 同一方向无限深挖 | 面试节奏失真 | Prompt + `AUTO_MODE_MAX_DEPTH` 双重限制 | 引入阶段状态机约束 |
| 评分虚高 | 回答一般但总分过高 | 要求 total 等于分项之和，不随意给高分 | 对分项范围做二次校验 |
| 流式输出中断 | 复盘文本不完整 | 当前可提示重试 | 支持断点续传或非流式降级 |

## 6. 面试中如何表述 Prompt 能力

推荐表述：

> 我没有把它做成普通 Chatbot，而是把模拟面试拆成 plan、round、review 三个协议阶段。plan 负责基于简历抽取追问点和岗位基础题，round 负责根据候选人回答生成下一问和五维评分，review 负责基于完整轨迹生成复盘。为了让前端状态机可靠消费，我要求模型输出固定 JSON 字段，并在服务端做解析、Zod 校验和 fallback；复盘阶段则切换成流式纯文本，提升阅读体验。

避免表述：

- 「自研 AI 算法」
- 「模型完全可靠」
- 「商业级智能面试官」

更准确的说法是：

- 「LLM 应用层协议设计」
- 「结构化 Prompt + 前端状态机消费」
- 「模型输出稳定性和异常兜底」
