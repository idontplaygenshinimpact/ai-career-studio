export type ReviewResult = {
	score: number;
	strengths: string[];
	risks: string[];
	suggestions: string[];
};

export type JdMatchResult = {
	score: number;
	matchedKeywords: string[];
	missingKeywords: string[];
	rewriteAdvice: string[];
	interviewDirections: string[];
};

export type ProjectPolishResult = {
	polished: string;
	highlights: string[];
	followUps: string[];
	resumeBullets: string[];
};

const jdKeywords = [
	"React",
	"Vue",
	"TypeScript",
	"Next",
	"性能优化",
	"工程化",
	"组件化",
	"状态管理",
	"可视化",
	"AI",
	"SSE",
	"部署",
];

export function buildReview(text: string): ReviewResult {
	const length = text.length;
	const hasProject = /项目|demo|上线|部署|SSE|React|Vue|TypeScript/i.test(text);
	const hasQuant = /\d+/.test(text);
	const hasInternship = /实习|公司|业务|标注|生产|协作/.test(text);
	const hasAi = /AI|模型|Prompt|SSE|流式|智能/i.test(text);

	const score = Math.min(
		96,
		Math.max(
			58,
			62 +
				(hasProject ? 10 : 0) +
				(hasQuant ? 6 : 0) +
				(hasInternship ? 7 : 0) +
				(hasAi ? 5 : 0) +
				Math.min(8, Math.floor(length / 360)),
		),
	);

	return {
		score,
		strengths: [
			"有真实实习经历，能支撑业务场景表达",
			"具备 Vue3 / React / TypeScript 双栈能力",
			"项目中有 AI 应用和工程化实践，方向明确",
		],
		risks: [
			"如果项目缺少部署和截图，作品集说服力会下降",
			"如果只有功能描述，没有问题-解决方案链路，会显得像功能清单",
			"如果没有量化描述，容易让面试官判断贡献度不足",
		],
		suggestions: [
			"把最强项目放在第一位，并强调你解决了什么问题",
			"每个项目至少补充一个关键技术难点和一个优化点",
			"用一句话说明为什么这项目值得上线和展示，而不是只列技术栈",
		],
	};
}

export function matchJd(jd: string, resume: string): JdMatchResult {
	const source = `${jd}\n${resume}`;
	const matchedKeywords = jdKeywords.filter((keyword) =>
		new RegExp(keyword, "i").test(source),
	);
	const requiredKeywords = jdKeywords.filter((keyword) =>
		new RegExp(keyword, "i").test(jd),
	);
	const missingKeywords = requiredKeywords.filter(
		(keyword) => !new RegExp(keyword, "i").test(resume),
	);
	const score = Math.min(
		96,
		Math.max(55, 58 + matchedKeywords.length * 4 - missingKeywords.length * 3),
	);

	return {
		score,
		matchedKeywords,
		missingKeywords:
			missingKeywords.length > 0
				? missingKeywords
				: ["量化指标", "线上地址", "复杂场景复盘"],
		rewriteAdvice: [
			"把 JD 中高频技能放进项目描述，例如 TypeScript、组件化、性能优化或工程化。",
			"将“做了功能”改成“解决了什么问题 + 如何实现 + 结果如何”。",
			"补充可验证材料：GitHub、在线地址、截图、性能或交互指标。",
		],
		interviewDirections: [
			"围绕最匹配的技术栈准备 2 个项目深挖问题。",
			"针对缺失关键词准备兜底回答：了解程度、学习路径、相似经验。",
			"准备一个失败/重构案例，体现工程反思能力。",
		],
	};
}

export function polishProject(raw: string): ProjectPolishResult {
	const hasAudio = /音乐|播放|audio/i.test(raw);
	const hasAi = /AI|模型|SSE|流式|Prompt/i.test(raw);
	const hasChart = /图表|ECharts|看板|统计/i.test(raw);

	const domain = hasAi
		? "AI 应用"
		: hasAudio
			? "音频播放"
			: hasChart
				? "数据可视化"
				: "前端项目";
	const polished = `围绕${domain}场景重构项目表达：基于 TypeScript 拆分核心业务模块，沉淀状态管理、异常处理和 UI 反馈链路，并通过组件化封装提升页面复用性与维护效率。`;

	return {
		polished,
		highlights: [
			"从“实现功能”升级为“解决场景问题”的表达。",
			"补充工程化关键词：类型约束、状态拆分、异常恢复、组件复用。",
			"保留可追问技术点，方便面试时展开讲清楚。",
		],
		followUps: [
			"这个项目里最复杂的状态流转是什么？",
			"如果用户快速切换页面或重复操作，你如何避免状态错乱？",
			"如果要把这个项目上线展示，你会优先补哪些稳定性能力？",
		],
		resumeBullets: [
			`基于 TypeScript 完成${domain}核心流程封装，拆分业务状态、UI 状态和异常状态，提升模块可维护性。`,
			"围绕真实使用场景补充边界处理和交互反馈，优化用户操作链路与页面稳定性。",
			"沉淀可复用组件、项目复盘材料和稳定性验证记录，提升后续迭代效率。",
		],
	};
}
