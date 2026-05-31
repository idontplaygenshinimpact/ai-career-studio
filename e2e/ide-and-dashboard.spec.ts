import { test, expect } from "@playwright/test";

test.describe("手写练习 IDE 核心流程", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/coding-practice");
		await page.waitForSelector("text=题目列表", { timeout: 15000 });
	});

	test("题目列表、统计卡片和编辑器加载", async ({ page }) => {
		await expect(page.locator("h1")).toContainText("手写 / 算法练习");
		await expect(page.locator("text=运行次数")).toBeVisible();
		await expect(page.getByText("快照", { exact: true })).toBeVisible();
		await expect(page.locator("text=收藏题目")).toBeVisible();
		await expect(page.locator("text=最近结果")).toBeVisible();
		await expect(page.getByRole("heading", { name: /手写防抖/ })).toBeVisible();
	});

	test("收藏按钮切换", async ({ page }) => {
		const favBtn = page.locator("button:has-text('☆ 收藏')");
		await expect(favBtn).toBeVisible();
		await favBtn.click();
		await expect(page.locator("button:has-text('★ 已收藏')")).toBeVisible();
		await page.locator("button:has-text('★ 已收藏')").click();
		await expect(page.locator("button:has-text('☆ 收藏')")).toBeVisible();
	});

	test("运行测试后显示结果和提交记录", async ({ page }) => {
		const runBtn = page.getByRole("button", { name: "运行测试", exact: true });
		await runBtn.click();
		await expect(
			page.getByRole("heading", { name: "全部通过" }).or(page.getByRole("heading", { name: "未通过" })),
		).toBeVisible({ timeout: 20000 });
		await expect(page.getByText("CPU", { exact: false }).first()).toBeVisible();
	});

	test("自定义测试面板打开和输入", async ({ page }) => {
		await page.getByRole("button", { name: /自定义测试/ }).click();
		const textarea = page.locator("textarea[placeholder*='__assert__']");
		await expect(textarea).toBeVisible();
		await textarea.fill("__assert__(true, '自定义断言通过');");
	});

	test("保存快照后出现快照卡片", async ({ page }) => {
		await page.getByRole("button", { name: /保存快照/ }).click();
		await expect(page.locator("text=代码快照")).toBeVisible();
		await expect(page.getByRole("button", { name: /恢复/ })).toBeVisible();
	});

	test("AI 审查按钮在无运行结果时禁用", async ({ page }) => {
		const aiBtn = page.getByRole("button", { name: /先运行测试/ });
		await expect(aiBtn).toBeDisabled();
	});
});

test.describe("模拟面试状态机与看板", () => {
	test("面试页显示状态机面板", async ({ page }) => {
		await page.goto("/mock-interview");
		await expect(page.locator("text=面试流程状态机")).toBeVisible();
		await expect(page.locator("text=简历输入")).toBeVisible();
		await expect(page.locator("text=AI 规划")).toBeVisible();
		await expect(page.locator("text=动态追问")).toBeVisible();
		await expect(page.locator("text=流式复盘")).toBeVisible();
	});

	test("简历不足 40 字时按钮禁用", async ({ page }) => {
		await page.goto("/mock-interview");
		const textarea = page.locator("#resume-context");
		await textarea.fill("太短了");
		const btn = page.getByRole("button", { name: /解析简历并开始/ });
		await expect(btn).toBeDisabled();
	});

	test("设置 API Key 面板可打开和关闭", async ({ page }) => {
		await page.goto("/mock-interview");
		await page.click("text=设置 API Key");
		const dialog = page.locator("role=dialog");
		await expect(dialog).toBeVisible();
		await expect(page.locator("#ai-key")).toBeVisible();
	});
});

test.describe("JD 匹配真实流程", () => {
	test("输入 JD 和简历后分析按钮可点", async ({ page }) => {
		await page.goto("/jd-match");
		await page.locator("#jd").fill("我们需要一名熟悉 React 和 TypeScript 的前端实习生，了解状态管理和工程化工具链。");
		await page.locator("#resume").fill("合肥工业大学计算机科学与技术专业大三在读，具备 Vue3 和 React 前端开发经验，熟悉状态管理和工程化配置。");
		const btn = page.getByRole("button", { name: /AI 匹配分析/ });
		await expect(btn).toBeEnabled();
	});
});

test.describe("负向路径", () => {
	test("手写练习运行失败代码后出现 AI 讲解按钮", async ({ page }) => {
		await page.goto("/coding-practice");
		await page.waitForSelector("text=题目列表", { timeout: 15000 });
		const runBtn = page.getByRole("button", { name: "运行测试", exact: true });
		await runBtn.click();
		await page.waitForSelector("text=未通过", { timeout: 20000 });
		await expect(page.getByRole("button", { name: /AI 讲解失败用例/ })).toBeVisible();
	});

	test("简历诊断空输入时按钮禁用", async ({ page }) => {
		await page.goto("/resume-review");
		const textarea = page.locator("#resume-review");
		await textarea.clear();
		await textarea.fill("");
		const btn = page.getByRole("button", { name: /AI 诊断/ });
		await expect(btn).toBeDisabled();
	});

	test("项目优化不足 10 字时按钮禁用", async ({ page }) => {
		await page.goto("/project-polish");
		const textarea = page.locator("#project");
		await textarea.clear();
		await textarea.fill("太短");
		const btn = page.getByRole("button", { name: /AI 优化/ });
		await expect(btn).toBeDisabled();
	});
});
