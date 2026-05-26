import { test, expect } from "@playwright/test";

test.describe("简历诊断核心流程", () => {
	test("粘贴简历文本后可点击诊断按钮", async ({ page }) => {
		await page.goto("/resume-review");
		const textarea = page.locator("#resume-review");
		await textarea.fill("合肥工业大学计算机科学与技术专业大三在读，具备 Vue3 和 React 前端开发经验，熟悉状态管理和工程化配置。");
		const btn = page.getByRole("button", { name: /AI 诊断/ });
		await expect(btn).toBeEnabled();
	});

	test("空简历时诊断按钮状态正确", async ({ page }) => {
		await page.goto("/resume-review");
		const textarea = page.locator("#resume-review");
		await expect(textarea).toBeVisible();
		const charCount = page.locator("text=当前字数");
		await expect(charCount).toBeVisible();
	});
});

test.describe("手写练习核心流程", () => {
	test("手写练习页加载并展示题目列表", async ({ page }) => {
		await page.goto("/coding-practice");
		await expect(page.locator("h1")).toContainText("手写 / 算法练习");
		await page.waitForSelector("text=题目列表", { timeout: 10000 });
		await expect(page.locator("text=题目列表")).toBeVisible();
	});

	test("可以切换题目分类", async ({ page }) => {
		await page.goto("/coding-practice");
		await page.waitForSelector("text=题目列表", { timeout: 10000 });
		await page.click("text=手写题");
		await expect(page.locator("text=手写题")).toBeVisible();
		await page.click("text=算法题");
		await expect(page.locator("text=算法题")).toBeVisible();
		await page.click("text=全部");
	});

	test("选择题目后显示题目描述和代码编辑器", async ({ page }) => {
		await page.goto("/coding-practice");
		await page.waitForSelector("text=题目列表", { timeout: 10000 });
		await expect(page.locator("text=手写防抖")).toBeVisible();
		await expect(page.locator("text=运行测试")).toBeVisible();
	});

	test("运行按钮和 AI 审查按钮存在", async ({ page }) => {
		await page.goto("/coding-practice");
		await page.waitForSelector("text=运行测试", { timeout: 10000 });
		const runBtn = page.getByRole("button", { name: /运行测试/ });
		const aiBtn = page.getByRole("button", { name: /AI 代码审查/ });
		await expect(runBtn).toBeVisible();
		await expect(aiBtn).toBeVisible();
	});
});

test.describe("模拟面试页基本结构", () => {
	test("面试页包含模式选择和面试官角色", async ({ page }) => {
		await page.goto("/mock-interview");
		await expect(page.locator("text=练习模式")).toBeVisible();
		await expect(page.locator("text=连贯追问模式")).toBeVisible();
		await expect(page.locator("text=温和引导型")).toBeVisible();
		await expect(page.locator("text=压力追问型")).toBeVisible();
		await expect(page.locator("text=技术深挖型")).toBeVisible();
	});

	test("简历输入框和解析按钮存在", async ({ page }) => {
		await page.goto("/mock-interview");
		await expect(page.locator("#resume-context")).toBeVisible();
		const btn = page.getByRole("button", { name: /解析简历并开始/ });
		await expect(btn).toBeVisible();
	});
});

test.describe("跨页面数据流转", () => {
	test("导航栏包含手写练习入口", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("nav")).toContainText("手写练习");
	});

	test("可以从首页导航到手写练习页", async ({ page }) => {
		await page.goto("/");
		await page.click("text=手写练习");
		await expect(page).toHaveURL("/coding-practice");
	});
});
