export type InterviewTopic = {
	id: string;
	focus: string;
	dimension: string;
	question: string;
	boundary: string;
	category?: "resume" | "fundamental";
};

export type InterviewRound = InterviewTopic & {
	feedback: string;
	followUp: string;
	trigger: string;
	answerStandard: string;
	shouldSwitchFocus?: boolean;
	switchReason?: string;
};

export type AnswerScore = {
	total: number;
	accuracy: number;
	structure: number;
	depth: number;
	riskHandling: number;
	reviewMindset: number;
	comment?: string;
};

export const frontendFundamentalTopics: InterviewTopic[] = [
	{
		id: "fundamental-http-cache",
		category: "fundamental",
		focus: "基础：HTTP 状态码与缓存",
		dimension: "HTTP 状态码、强缓存、协商缓存、304、资源缓存策略",
		question:
			"先插一个前端实习高频基础：HTTP 常见状态码有哪些？304 和 200 from cache 的区别是什么？强缓存和协商缓存分别看哪些 Header？",
		boundary:
			"只围绕 HTTP 状态码、304、强缓存/协商缓存、Cache-Control、Expires、ETag、Last-Modified、静态资源缓存策略追问，不扩展到服务端缓存集群实现。",
	},
	{
		id: "fundamental-url-rendering",
		category: "fundamental",
		focus: "基础：URL 到页面展示",
		dimension: "DNS、TCP、TLS、HTTP、DOM/CSSOM、Layout/Paint/Composite",
		question:
			"从浏览器输入 URL 到页面展示，完整链路是什么？请按网络请求和浏览器渲染两段讲。",
		boundary:
			"只围绕 URL 解析、DNS、TCP 三次握手、TLS、HTTP 请求响应、HTML/CSS/JS 解析、DOM/CSSOM/渲染树、回流重绘合成追问，不深入浏览器内核源码。",
	},
	{
		id: "fundamental-tcp-https",
		category: "fundamental",
		focus: "基础：TCP / UDP / HTTPS",
		dimension: "TCP UDP 区别、三次握手四次挥手、可靠传输、TLS 加密",
		question:
			"TCP 和 UDP 有什么区别？TCP 为什么要三次握手、四次挥手？HTTPS 的 TLS 握手大致做了什么？",
		boundary:
			"只围绕 TCP/UDP 基础差异、可靠传输、三次握手四次挥手、HTTPS/TLS 基本流程、对称/非对称加密职责追问，不深入拥塞控制公式或内核实现。",
	},
	{
		id: "fundamental-cors-streaming",
		category: "fundamental",
		focus: "基础：跨域与 SSE/WebSocket",
		dimension: "同源策略、CORS、预检请求、SSE/WebSocket 场景取舍",
		question:
			"跨域的本质是什么？CORS 预检请求什么时候触发？SSE 和 WebSocket 的差异与适用场景是什么？",
		boundary:
			"只围绕同源策略、CORS、Access-Control-Allow-Origin、预检请求、凭证模式、SSE 与 WebSocket 取舍追问，不追问后端网关或网络内核实现。",
	},
	{
		id: "fundamental-js-prototype",
		category: "fundamental",
		focus: "基础：JavaScript 类型与原型链",
		dimension: "JS 数据类型、类型判断、数组判断、原型链、new、instanceof",
		question:
			"JS 基本数据类型有哪些？typeof null 为什么是 object？判断数组有哪些方式？原型链和 instanceof 的原理是什么？",
		boundary:
			"只围绕 JS 类型、typeof、instanceof、Object.prototype.toString、Array.isArray、原型链、new 操作符、构造函数与 prototype 追问，不深入 JS 引擎源码。",
	},
	{
		id: "fundamental-event-loop",
		category: "fundamental",
		focus: "基础：事件循环与 Promise",
		dimension: "宏任务、微任务、Promise、async/await、请求乱序",
		question:
			"讲一下浏览器事件循环：宏任务和微任务分别有哪些？Promise、async/await、setTimeout 的执行顺序怎么判断？",
		boundary:
			"只围绕浏览器事件循环、宏任务、微任务、Promise、async/await、setTimeout、requestAnimationFrame、异步请求乱序追问，不扩展到 Node.js libuv 深层实现。",
	},
	{
		id: "fundamental-css-layout",
		category: "fundamental",
		focus: "基础：CSS 与布局",
		dimension: "盒模型、BFC、Flex/Grid、移动端适配、动画性能",
		question:
			"面试官问布局基础和移动端适配时，你会怎么讲盒模型、BFC、Flex/Grid 和动画性能？",
		boundary:
			"只围绕盒模型、BFC、居中、三栏布局、Flex/Grid、选择器优先级、移动端适配、0.5px、动画和 transform 性能追问，不追问复杂图形算法或设计系统治理。",
	},
	{
		id: "fundamental-browser-security",
		category: "fundamental",
		focus: "基础：浏览器存储与安全",
		dimension: "cookie、localStorage、sessionStorage、JWT、XSS、CSRF",
		question:
			"cookie、localStorage、sessionStorage 有什么区别？JWT 如果被劫持会怎样？XSS 和 CSRF 分别是什么，前端能怎么防？",
		boundary:
			"只围绕浏览器存储、登录态、cookie 属性、JWT 风险、XSS、CSRF、SameSite、HttpOnly、前端安全基础追问，不深入企业级风控系统。",
	},
	{
		id: "fundamental-frameworks",
		category: "fundamental",
		focus: "基础：Vue / React 框架",
		dimension: "响应式、组件通信、Hooks、Redux/Pinia、Diff/key",
		question:
			"如果比较 Vue 和 React 的状态更新模型、列表 key、组件通信和全局状态管理，你会怎么说？",
		boundary:
			"只围绕 Vue3 Composition API、响应式、生命周期、key、组件通信、Pinia；React Hooks、Redux Toolkit、路由、受控组件、Diff 基本思想追问，不深入完整框架调度源码。",
	},
	{
		id: "fundamental-engineering-performance",
		category: "fundamental",
		focus: "基础：工程化与性能",
		dimension: "Vite/Webpack、代码分割、懒加载、质量规范、性能验证",
		question:
			"Vite/Webpack 的核心差异是什么？路由懒加载、动态 import、Tree Shaking 和首屏性能优化分别解决什么问题？",
		boundary:
			"只围绕 Vite/Webpack 基本差异、loader/plugin 概念、代码分割、路由懒加载、Tree Shaking、ESLint/Prettier、构建体积、首屏性能追问，不要求实现完整打包器。",
	},
	{
		id: "fundamental-handwritten",
		category: "fundamental",
		focus: "基础：手写题与算法意识",
		dimension: "防抖节流、Promise.all、深拷贝、并发控制、数组扁平化、基础算法",
		question:
			"前端实习常见手写题里，防抖节流、Promise.all、深拷贝、数组 flat、并发控制的核心思路分别是什么？",
		boundary:
			"只围绕防抖节流、Promise.all/race、深拷贝、flat、new、bind、并发控制、数组/字符串/树基础题追问，不要求复杂竞赛算法。",
	},
];

export function createOpeningRound(topic: InterviewTopic): InterviewRound {
	return {
		...topic,
		feedback:
			"先按真实面试节奏说明背景、个人职责、关键取舍和可验证结果，再根据回答继续追问。",
		followUp: "请结合真实经历回答，不要只复述简历 bullet。",
		trigger: `来自解析后的简历追问点：${topic.focus}。逻辑边界：${topic.boundary}`,
		answerStandard: `合格回答需要覆盖背景、个人动作、技术选择、结果或验证方式；追问必须严格控制在逻辑边界内：${topic.boundary}`,
	};
}

type TermCategory = {
	name: string;
	terms: string[];
};

const normalizeScoringText = (text: string) =>
	text.toLowerCase().replace(/\s+/g, " ").trim();

const clampScore = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

const splitSegments = (text: string) =>
	text
		.replace(/\r\n/g, "\n")
		.split(/\n{2,}/)
		.map((segment) => segment.trim())
		.filter(Boolean);

const splitSentences = (text: string) =>
	text
		.replace(/\r\n/g, "\n")
		.split(/[。！？!?；;\n]+/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);

const collectTermMatches = (text: string, categories: TermCategory[]) => {
	const normalizedText = normalizeScoringText(text);
	const matchedCategories = new Set<string>();
	const matchedTerms = new Set<string>();

	for (const category of categories) {
		for (const term of category.terms) {
			if (normalizedText.includes(term)) {
				matchedCategories.add(category.name);
				matchedTerms.add(term);
			}
		}
	}

	return { matchedCategories, matchedTerms };
};

const countSentenceSpread = (sentences: string[], terms: string[]) => {
	if (sentences.length === 0 || terms.length === 0) {
		return { spreadRatio: 0, bucketCount: 0 };
	}

	const bucketHits = new Set<number>();
	let sentenceHits = 0;

	for (let index = 0; index < sentences.length; index += 1) {
		const sentence = normalizeScoringText(sentences[index]);
		const hasTerm = terms.some((term) => sentence.includes(term));
		if (!hasTerm) {
			continue;
		}

		sentenceHits += 1;
		const bucket = Math.min(2, Math.floor((index / sentences.length) * 3));
		bucketHits.add(bucket);
	}

	return {
		spreadRatio: sentenceHits / Math.max(sentences.length, 1),
		bucketCount: bucketHits.size,
	};
};

const measureAccuracy = (text: string): number => {
	// 技术准确性：按“技术术语分类覆盖 + 术语密度”评估，避免只靠单个关键词命中。
	const categories: TermCategory[] = [
		{
			name: "frontend-framework",
			terms: [
				"react",
				"vue",
				"next.js",
				"nextjs",
				"hooks",
				"redux",
				"pinia",
				"composition api",
				"virtual dom",
				"diff",
				"component",
				"props",
				"state",
			],
		},
		{
			name: "network-protocol",
			terms: [
				"http",
				"https",
				"tcp",
				"udp",
				"tls",
				"dns",
				"cors",
				"cookie",
				"etag",
				"cache-control",
				"service worker",
				"sse",
				"websocket",
				"api",
			],
		},
		{
			name: "engineering-tooling",
			terms: [
				"vite",
				"webpack",
				"rollup",
				"esbuild",
				"tree shaking",
				"code splitting",
				"lazy load",
				"dynamic import",
				"eslint",
				"prettier",
				"build",
				"bundle",
			],
		},
		{
			name: "runtime-performance",
			terms: [
				"performance",
				"render",
				"paint",
				"composite",
				"layout",
				"reflow",
				"repaint",
				"memory",
				"optimization",
				"profiling",
				"benchmark",
			],
		},
		{
			name: "state-async",
			terms: [
				"promise",
				"async",
				"await",
				"event loop",
				"microtask",
				"macrotask",
				"queue",
				"debounce",
				"throttle",
				"observer",
			],
		},
		{
			name: "testing-quality",
			terms: [
				"test",
				"unit test",
				"e2e",
				"vitest",
				"playwright",
				"assert",
				"validation",
				"monitoring",
			],
		},
	];

	const { matchedCategories, matchedTerms } = collectTermMatches(text, categories);
	if (matchedTerms.size === 0) {
		return 0;
	}

	const textLengthFactor = clampScore(text.length / 600, 0, 2);
	const categoryCoverageScore = matchedCategories.size * 3.5;
	const termCoverageScore = Math.min(matchedTerms.size * 0.9, 8);
	const densityScore = clampScore(
		matchedTerms.size / Math.max(text.length / 80, 1),
		0,
		4,
	);

	return Math.min(
		30,
		Math.round(categoryCoverageScore + termCoverageScore + densityScore + textLengthFactor),
	);
};

const measureStructure = (text: string): number => {
	// 表达结构：结合段落层次、连接词多样性、连接词分布和句长方差综合评估。
	const sentences = splitSentences(text);
	const paragraphSegments = splitSegments(text);
	const lines = text
		.replace(/\r\n/g, "\n")
		.split(/\n+/)
		.map((line) => line.trim())
		.filter(Boolean);

	const connectorGroups: TermCategory[] = [
		{ name: "progression", terms: ["首先", "其次", "再次", "然后", "接着", "最后", "最终", "进一步", "一方面", "另一方面", "同时", "另外"] },
		{ name: "causal", terms: ["因为", "所以", "因此", "于是", "从而", "导致", "由于", "结果", "基于"] },
		{ name: "contrast", terms: ["但是", "不过", "然而", "相反", "反而", "相比", "而是", "尽管", "虽然"] },
		{ name: "exemplify", terms: ["比如", "例如", "举例", "像"] },
		{ name: "conditional", terms: ["如果", "当", "一旦", "只要", "除非", "否则"] },
		{ name: "summary", terms: ["总之", "总体", "总结", "归纳", "最后来说"] },
	];

	const { matchedCategories, matchedTerms } = collectTermMatches(text, connectorGroups);
	const { spreadRatio, bucketCount } = countSentenceSpread(sentences, Array.from(matchedTerms));

	const sentenceLengths = sentences
		.map((sentence) => sentence.replace(/\s+/g, "").length)
		.filter((length) => length > 0);
	const averageLength =
		sentenceLengths.reduce((sum, length) => sum + length, 0) /
		Math.max(sentenceLengths.length, 1);
	const variance =
		sentenceLengths.length > 1
			? sentenceLengths.reduce((sum, length) => sum + (length - averageLength) ** 2, 0) /
			  sentenceLengths.length
			: 0;
	const stdDev = Math.sqrt(variance);

	const sentenceScore = clampScore((sentences.length - 1) * 2.2, 0, 7);
	const paragraphScore = clampScore((paragraphSegments.length - 1) * 2.6, 0, 5);
	const bulletScore = clampScore(lines.filter((line) => /^([0-9]+[.)]|[-*•])/u.test(line)).length * 1.2, 0, 3);
	const connectorVarietyScore = clampScore(matchedCategories.size * 2.1, 0, 8);
	const connectorSpreadScore = clampScore(spreadRatio * 5.5, 0, 5.5);
	const connectorDistributionScore = clampScore(bucketCount * 1.6, 0, 4.8);
	const varianceScore = clampScore(stdDev / 6, 0, 4);
	const lengthBonus = clampScore(text.length / 700, 0, 1.2);

	return Math.min(
		25,
		Math.round(
			sentenceScore +
				paragraphScore +
				bulletScore +
				connectorVarietyScore +
				connectorSpreadScore +
				connectorDistributionScore +
				varianceScore +
				lengthBonus,
		),
	);
};

const measureDepth = (text: string): number => {
	// 技术深度：看是否解释原理、对比方案、权衡取舍和实现细节，而不是只停留在结论。
	const categories: TermCategory[] = [
		{
			name: "principle",
			terms: [
				"原理",
				"机制",
				"本质",
				"底层",
				"调度",
				"生命周期",
				"响应式",
				"diff",
				"虚拟 dom",
				"事件循环",
				"握手",
				"缓存策略",
				"状态机",
				"依赖收集",
			],
		},
		{
			name: "comparison",
			terms: [
				"对比",
				"相比",
				"区别",
				"差异",
				"取舍",
				"权衡",
				"选择",
				"适合",
				"不适合",
				"方案",
				"tradeoff",
			],
		},
		{
			name: "implementation",
			terms: [
				"实现",
				"接口",
				"参数",
				"配置",
				"hook",
				"middleware",
				"selector",
				"worker",
				"listener",
				"pipeline",
				"模块",
				"流程",
				"落地",
				"拆分",
			],
		},
		{
			name: "validation",
			terms: [
				"验证",
				"指标",
				"数据",
				"监控",
				"压测",
				"benchmark",
				"profiling",
				"测试",
				"回归",
				"观测",
				"日志",
				"量化",
			],
		},
	];

	const { matchedCategories, matchedTerms } = collectTermMatches(text, categories);
	if (matchedTerms.size === 0) {
		return 0;
	}

	const principleHits = categories[0].terms.filter((term) =>
		normalizeScoringText(text).includes(term),
	).length;
	const comparisonHits = categories[1].terms.filter((term) =>
		normalizeScoringText(text).includes(term),
	).length;
	const implementationHits = categories[2].terms.filter((term) =>
		normalizeScoringText(text).includes(term),
	).length;
	const validationHits = categories[3].terms.filter((term) =>
		normalizeScoringText(text).includes(term),
	).length;

	const lengthBonus = clampScore(text.length / 800, 0, 1.8);
	const principleScore = Math.min(principleHits * 1.6, 8);
	const comparisonScore = Math.min(comparisonHits * 1.3, 6);
	const implementationScore = Math.min(implementationHits * 1.0, 8);
	const validationScore = Math.min(validationHits * 1.1, 3);
	const categoryCoverageBonus = matchedCategories.size * 1.2;

	return Math.min(
		25,
		Math.round(
			principleScore +
				comparisonScore +
				implementationScore +
				validationScore +
				categoryCoverageBonus +
				lengthBonus,
		),
	);
};

const measureRiskHandling = (text: string): number => {
	// 风险处理：关注异常、降级、兜底、重试、边界条件和幂等/并发意识。
	const categories: TermCategory[] = [
		{
			name: "anomaly",
			terms: [
				"异常",
				"错误",
				"失败",
				"崩溃",
				"超时",
				"取消",
				"空值",
				"null",
				"报错",
				"try catch",
				"throw",
			],
		},
		{
			name: "mitigation",
			terms: [
				"降级",
				"兜底",
				"重试",
				"回滚",
				"熔断",
				"限流",
				"fallback",
				"默认",
				"校验",
				"timeout",
				"abort",
			],
		},
		{
			name: "boundary",
			terms: [
				"边界",
				"边界条件",
				"极端",
				"并发",
				"race",
				"重复提交",
				"幂等",
				"兼容",
				"空数据",
				"兜底方案",
			],
		},
	];

	const { matchedCategories, matchedTerms } = collectTermMatches(text, categories);
	if (matchedTerms.size === 0) {
		return 0;
	}

	const normalizedText = normalizeScoringText(text);
	const conditionalHints = ["如果", "当", "一旦", "否则", "否则就", "若", "在...时"];
	const conditionalHits = conditionalHints.filter((term) => normalizedText.includes(term)).length;

	const anomalyHits = categories[0].terms.filter((term) => normalizedText.includes(term)).length;
	const mitigationHits = categories[1].terms.filter((term) => normalizedText.includes(term)).length;
	const boundaryHits = categories[2].terms.filter((term) => normalizedText.includes(term)).length;

	const anomalyScore = Math.min(anomalyHits * 1.5, 7);
	const mitigationScore = Math.min(mitigationHits * 1.5, 8);
	const boundaryScore = Math.min(boundaryHits * 1.2, 4);
	const conditionalScore = Math.min(conditionalHits * 1.1, 2.5);
	const categoryCoverageBonus = matchedCategories.size * 1.1;
	const lengthBonus = clampScore(text.length / 900, 0, 1.5);

	return Math.min(
		20,
		Math.round(
			anomalyScore +
				mitigationScore +
				boundaryScore +
				conditionalScore +
				categoryCoverageBonus +
				lengthBonus,
		),
	);
};

const measureReviewMindset = (text: string, roundIndex: number): number => {
	// 复盘意识：看是否体现改进、量化验证、优化思路和教训总结，而不是泛泛说“下次注意”。
	const categories: TermCategory[] = [
		{
			name: "reflection",
			terms: [
				"复盘",
				"反思",
				"总结",
				"经验",
				"教训",
				"发现",
				"问题",
				"沉淀",
			],
		},
		{
			name: "improvement",
			terms: [
				"优化",
				"改进",
				"迭代",
				"重构",
				"调整",
				"下一步",
				"后续",
				"持续",
			],
		},
		{
			name: "quantify",
			terms: [
				"指标",
				"数据",
				"结果",
				"对比",
				"验证",
				"量化",
				"监控",
				"统计",
				"ab test",
			],
		},
		{
			name: "planning",
			terms: [
				"计划",
				"之后",
				"以后",
				"会先",
				"先做",
				"规范",
				"文档",
			],
		},
	];

	const { matchedCategories, matchedTerms } = collectTermMatches(text, categories);
	if (matchedTerms.size === 0) {
		return 0;
	}

	const normalizedText = normalizeScoringText(text);
	const reflectionHits = categories[0].terms.filter((term) => normalizedText.includes(term)).length;
	const improvementHits = categories[1].terms.filter((term) => normalizedText.includes(term)).length;
	const quantifyHits = categories[2].terms.filter((term) => normalizedText.includes(term)).length;
	const planningHits = categories[3].terms.filter((term) => normalizedText.includes(term)).length;
	const roundBonus = clampScore(roundIndex * 0.2, 0, 1.2);
	const reflectionScore = Math.min(reflectionHits * 1.4, 5);
	const improvementScore = Math.min(improvementHits * 1.5, 5);
	const quantifyScore = Math.min(quantifyHits * 1.6, 4.5);
	const planningScore = Math.min(planningHits * 1.1, 3);
	const categoryCoverageBonus = matchedCategories.size * 1.1;
	const lengthBonus = clampScore(text.length / 950, 0, 1.2);

	return Math.min(
		15,
		Math.round(
			reflectionScore +
				improvementScore +
				quantifyScore +
				planningScore +
				categoryCoverageBonus +
				lengthBonus +
				roundBonus,
		),
	);
};

export function scoreInterviewAnswer(
	answer: string,
	roundIndex: number,
): AnswerScore {
	const text = answer.trim();
	if (!text) {
		return {
			accuracy: 0,
			structure: 0,
			depth: 0,
			riskHandling: 0,
			reviewMindset: 0,
			total: 0,
		};
	}

	const lengthFactor = Math.min(1, text.length / 200);
	const hasContent = text.length > 0 ? 1 : 0;

	const accuracy = measureAccuracy(text) + Math.round(6 * lengthFactor) + 2 * hasContent;
	const structure = measureStructure(text) + Math.round(5 * lengthFactor) + 2 * hasContent;
	const depth = measureDepth(text) + Math.round(4 * lengthFactor) + hasContent;
	const riskHandling = measureRiskHandling(text) + Math.round(3 * lengthFactor) + hasContent;
	const reviewMindset = measureReviewMindset(text, roundIndex) + Math.round(2 * lengthFactor) + hasContent;
	const total = Math.min(
		96,
		accuracy + structure + depth + riskHandling + reviewMindset,
	);

	return {
		accuracy: Math.min(30, accuracy),
		structure: Math.min(25, structure),
		depth: Math.min(25, depth),
		riskHandling: Math.min(20, riskHandling),
		reviewMindset: Math.min(15, reviewMindset),
		total,
	};
}

export function getInterviewSummary(score: number) {
	if (score >= 90) {
		return "你已经具备较强的项目表达能力，下一步建议强化复杂场景下的边界处理。";
	}

	if (score >= 75) {
		return "项目理解还不错，但对异常、性能和重构思路的表达可以更完整。";
	}

	return "建议回到项目本身，补全协议选择、状态流转和异常处理的关键链路。";
}
