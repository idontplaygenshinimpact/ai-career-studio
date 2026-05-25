# AI Career Studio

一个面向前端实习 / 校招场景的 AI 求职训练工作台，包含 JD 匹配、简历诊断、项目经历优化和多轮模拟面试追问。

项目重点不是做普通 Chatbot，而是把求职训练拆成结构化任务流：评分、风险点、追问链、即时反馈和复盘报告。

## Features

- JD 匹配：关键词命中、缺失项、改写建议、面试准备方向
- 简历诊断：支持粘贴文本或上传 `.txt` / `.md` / `.json` / `.docx`，实时输出评分、风险点、优化建议
- 项目优化：输入项目描述后生成大厂风格表达、追问点和简历 bullet
- 真实模拟面试：上传或粘贴真实简历后，由真实 AI 解析项目 / 实习 / 技能线索，再按练习 / 连贯追问双模式生成追问、动态评分和 Markdown 复盘报告
- 作品集首页：展示能力矩阵、求职训练工作流和简历可写亮点
- 真实 AI 面试官：支持 OpenAI-compatible API；真实面试模式不使用 Mock 兜底，未配置密钥时会明确提示配置问题

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS 3
- App Router

## Pages

- `/` 首页
- `/jd-match` 岗位匹配
- `/resume-review` 简历诊断
- `/project-polish` 项目优化
- `/mock-interview` 模拟面试

## Portfolio Highlights

- 基于 Next.js App Router + TypeScript 搭建作品集级 AI 产品原型，适合部署到 Vercel 展示。
- 将 AI 输出拆为结构化数据模块，覆盖 JD 命中、评分、风险、建议、追问和复盘，避免只输出一段聊天文本。
- 模拟面试页支持上传 / 粘贴真实简历，先由真实模型解析追问计划，再按练习 / 连贯追问双模式推进，并展示触发依据、考察维度、合格标准。
- 简历诊断页和模拟面试页支持多格式文件导入，Word 简历通过客户端解析提取文本。
- 全站采用深色“求职作战室”视觉风格，适配桌面端和移动端。

## Resume File Support

当前支持：

- `.txt`
- `.md`
- `.json`
- `.docx`

说明：文件解析在浏览器端完成，模拟面试会把解析出的简历文本发送给配置的真实 AI 接口生成追问。PDF 暂不直接解析，建议复制 PDF 文本粘贴，或转为 `.docx` / `.txt` 后上传。

## Resume Description

可写入简历的项目描述：

> AI Career Studio：基于 Next.js + TypeScript 搭建 AI 求职训练工作台，覆盖 JD 匹配、简历诊断、项目经历优化和真实多轮模拟面试追问；设计结构化真实 AI 面试官输出协议，将简历解析、岗位基础题、追问链和复盘报告拆分为可复用数据模块；实现回答驱动的面试流程，支持逐轮回答、动态分项评分与 Markdown 结果复盘，适合部署到 Vercel 并作为 GitHub 作品集展示。

## Run Locally

```bash
npm install
npm run dev
```

```bash
npm run build
npm run lint
```

## Real AI Setup

真实模拟面试必须配置 OpenAI-compatible 模型密钥；未配置密钥时不会使用 Mock 兜底，而是直接提示配置问题，避免生成不真实的面试体验。

如需接入真实模型，新建 `.env.local`：

```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_api_key_here
AI_MODEL=gpt-4o-mini
```

也可以换成任意 OpenAI-compatible 服务，例如 Mindflow：

```env
AI_BASE_URL=https://ai.mindflow.com.cn/v1
AI_API_KEY=your_mindflow_key_here
AI_MODEL=gpt-5.5
```

服务端接口位于 `/api/interview-ai`：

- `action=plan`：基于真实简历解析项目 / 实习 / 技能追问点，并追加前端岗位高频基础题
- `action=round`：基于上一轮回答、当前逻辑边界和已覆盖内容生成下一轮真实追问
- 返回 `trigger / dimension / answerStandard / boundary`，保证追问可解释、可复盘

## Deploy

推荐部署到 Vercel。配置环境变量后即可使用真实模拟面试；未配置真实 AI Key 时，其他本地分析功能仍可访问，但真实面试不会启动。

## Notes

当前版本的模拟面试已切换为真实 AI 面试官流程，不再使用硬编码候选人简历或 Mock 接口兜底。
