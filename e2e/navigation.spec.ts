import { test, expect } from "@playwright/test";

test.describe("页面导航", () => {
	test("首页加载并展示标题", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("h1")).toContainText("AI 求职训练系统");
	});

	test("导航栏包含所有页面链接", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("nav")).toContainText("首页");
		await expect(page.locator("nav")).toContainText("JD 匹配");
		await expect(page.locator("nav")).toContainText("简历诊断");
		await expect(page.locator("nav")).toContainText("项目优化");
		await expect(page.locator("nav")).toContainText("模拟面试");
	});

	test("可以导航到 JD 匹配页", async ({ page }) => {
		await page.goto("/");
		await page.click("text=JD 匹配");
		await expect(page).toHaveURL("/jd-match");
		await expect(page.locator("h1")).toContainText("岗位匹配");
	});

	test("可以导航到简历诊断页", async ({ page }) => {
		await page.goto("/");
		await page.click("text=简历诊断");
		await expect(page).toHaveURL("/resume-review");
		await expect(page.locator("h1")).toContainText("简历诊断");
	});

	test("可以导航到项目优化页", async ({ page }) => {
		await page.goto("/");
		await page.click("text=项目优化");
		await expect(page).toHaveURL("/project-polish");
		await expect(page.locator("h1")).toContainText("项目经历优化");
	});

	test("可以导航到模拟面试页", async ({ page }) => {
		await page.goto("/");
		await page.click("text=模拟面试");
		await expect(page).toHaveURL("/mock-interview");
		await expect(page.locator("h1")).toContainText("真实模拟面试");
	});
});

test.describe("JD 匹配页", () => {
	test("有 JD 和简历输入框", async ({ page }) => {
		await page.goto("/jd-match");
		await expect(page.locator("#jd")).toBeVisible();
		await expect(page.locator("#resume")).toBeVisible();
	});

	test("分析按钮初始可点击", async ({ page }) => {
		await page.goto("/jd-match");
		const button = page.getByRole("button", { name: /AI 匹配分析/ });
		await expect(button).toBeVisible();
	});
});

test.describe("简历诊断页", () => {
	test("有简历输入框和分析按钮", async ({ page }) => {
		await page.goto("/resume-review");
		await expect(page.locator("#resume-review")).toBeVisible();
		const button = page.getByRole("button", { name: /AI 诊断/ });
		await expect(button).toBeVisible();
	});

	test("有文件上传入口", async ({ page }) => {
		await page.goto("/resume-review");
		await expect(page.locator("input[type=file]")).toBeAttached();
	});
});

test.describe("项目优化页", () => {
	test("有项目描述输入框", async ({ page }) => {
		await page.goto("/project-polish");
		await expect(page.locator("#project")).toBeVisible();
	});
});

test.describe("模拟面试页", () => {
	test("有简历输入框和模式选择", async ({ page }) => {
		await page.goto("/mock-interview");
		await expect(page.locator("#resume-context")).toBeVisible();
		await expect(page.locator("text=练习模式")).toBeVisible();
		await expect(page.locator("text=连贯追问模式")).toBeVisible();
	});

	test("有面试官角色选择", async ({ page }) => {
		await page.goto("/mock-interview");
		await expect(page.locator("text=温和引导型")).toBeVisible();
		await expect(page.locator("text=压力追问型")).toBeVisible();
		await expect(page.locator("text=技术深挖型")).toBeVisible();
	});

	test("设置面板可打开", async ({ page }) => {
		await page.goto("/mock-interview");
		await page.click("text=设置 API Key");
		await expect(page.locator("role=dialog")).toBeVisible();
		await expect(page.locator("#ai-key")).toBeVisible();
	});
});
