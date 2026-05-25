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

export function scoreInterviewAnswer(
	answer: string,
	roundIndex: number,
): AnswerScore {
	const text = answer.trim();
	const hasStructure = /首先|其次|最后|第一|第二|因为|所以|场景|方案|结果/.test(
		text,
	);
	const hasRisk = /异常|边界|失败|取消|重试|降级|兜底/.test(text);
	const hasDepth = /状态|性能|缓存|协议|架构|复用|抽象|验证/.test(text);
	const hasReview = /复盘|优化|重构|指标|验证|改进/.test(text);
	const lengthFactor = Math.min(text.length / 180, 1);

	const accuracy = Math.round(14 + lengthFactor * 8 + (hasDepth ? 6 : 0));
	const structure = Math.round(12 + lengthFactor * 6 + (hasStructure ? 8 : 0));
	const depth = Math.round(10 + lengthFactor * 6 + (hasDepth ? 10 : 0));
	const riskHandling = Math.round(8 + lengthFactor * 4 + (hasRisk ? 10 : 0));
	const reviewMindset = Math.round(8 + roundIndex + (hasReview ? 8 : 0));

	return {
		accuracy: Math.min(30, accuracy),
		structure: Math.min(25, structure),
		depth: Math.min(25, depth),
		riskHandling: Math.min(20, riskHandling),
		reviewMindset: Math.min(15, reviewMindset),
		total: Math.min(
			96,
			Math.round(
				accuracy + structure + depth + riskHandling + reviewMindset - 18,
			),
		),
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
