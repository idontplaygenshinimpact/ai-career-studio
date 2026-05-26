export const highlightStats = [
	{ label: "核心模块", value: "6" },
	{ label: "追问模式", value: "回答驱动" },
	{ label: "手写题库", value: "13 题" },
];

export const navItems = [
	{ label: "首页", href: "/" },
	{ label: "JD 匹配", href: "/jd-match" },
	{ label: "简历诊断", href: "/resume-review" },
	{ label: "项目优化", href: "/project-polish" },
	{ label: "模拟面试", href: "/mock-interview" },
	{ label: "手写练习", href: "/coding-practice" },
];

export const featureCards = [
	{
		badge: "Resume Review",
		title: "简历诊断",
		description:
			"输入简历内容后，输出评分、优势、风险点和优化建议，帮助你把项目和实习经历改成更符合大厂筛选口径的表达。",
	},
	{
		badge: "JD Match",
		title: "岗位匹配",
		description:
			"针对目标岗位 JD 做关键词命中、缺失项提醒和改写建议，快速判断简历和岗位之间的匹配度。",
	},
	{
		badge: "Real Interview",
		title: "真实模拟面试追问",
		description:
			"上传真实简历后先解析项目、实习和技能线索，再由真实 AI 面试官围绕项目、基础、工程化和场景设计不断深挖。",
	},
];

export const workflowSteps = [
	{
		title: "输入目标岗位和材料",
		description: "填写目标岗位 JD、粘贴简历和项目经历，系统先判断岗位匹配度。",
	},
	{
		title: "生成结构化分析",
		description:
			"系统输出评分、风险点、缺失关键词、优化建议和项目改写结果，而不是一大段聊天文本。",
	},
	{
		title: "开始多轮追问",
		description:
			"每次回答后，系统根据回答内容触发下一轮追问，持续挑战你的项目理解和表达能力。",
	},
	{
		title: "生成复盘报告",
		description:
			"面试结束后输出分项评分、短板、复习建议和可复制 Markdown 复盘。",
	},
];

export const capabilityMatrix = [
	{
		title: "结构化分析",
		value: "Score / Risk / Advice",
		description:
			"把简历、JD、项目经历拆成评分、风险项和可执行建议，避免 AI 输出停留在泛泛而谈。",
	},
	{
		title: "追问链路",
		value: "Real AI",
		description:
			"围绕真实简历里的项目、实习、基础知识和工程化能力连续追问，贴近真实面试压力。",
	},
	{
		title: "复盘报告",
		value: "Review Report",
		description:
			"根据回答完整度生成分项评分、短板和下一步复习建议，形成可循环的训练闭环。",
	},
];

export const techStack = [
	"Next.js 15 + React 18 + TypeScript",
	"Tailwind CSS + 响应式深色工作台 UI",
	"Zustand 状态管理 + Zod 请求校验",
	"真实 AI Chat Completions 接口 + 结构化 JSON 输出协议",
	"CodeMirror 6 代码编辑器 + Web Worker 沙箱执行",
	"浏览器端简历文件解析：txt / md / json / docx",
	"模块化训练链路：JD 匹配、简历诊断、项目优化、模拟面试、手写练习",
];
