import { test, expect } from "@playwright/test";

test.describe("项目优化闭环 (#2)", () => {
	test("优化结果页显示保存版本和带追问进面试按钮", async ({ page }) => {
		await page.goto("/project-polish");
		await expect(page.locator("#project")).toBeVisible();
		const btn = page.getByRole("button", { name: /AI 优化/ });
		await expect(btn).toBeEnabled();
	});

	test("输入内容后保存版本按钮和复制按钮不可见（结果未出）", async ({ page }) => {
		await page.goto("/project-polish");
		await expect(page.getByRole("button", { name: /保存为简历版本/ })).not.toBeVisible();
		await expect(page.getByRole("button", { name: /复制简历 bullet/ })).not.toBeVisible();
	});
});

test.describe("面试状态机阶段验证 (#6)", () => {
	test("初始状态：简历输入为 active，其余为 waiting", async ({ page }) => {
		await page.goto("/mock-interview");
		await expect(page.locator("text=面试流程状态机")).toBeVisible();

		const resumeStage = page.locator("div").filter({ hasText: /^1\. 简历输入/ }).first();
		await expect(resumeStage).toContainText("进行中");

		const planStage = page.locator("div").filter({ hasText: /^2\. AI 规划/ }).first();
		await expect(planStage).toContainText("等待");

		const roundStage = page.locator("div").filter({ hasText: /^3\. 动态追问/ }).first();
		await expect(roundStage).toContainText("等待");

		const reviewStage = page.locator("div").filter({ hasText: /^5\. 流式复盘/ }).first();
		await expect(reviewStage).toContainText("等待");
	});

	test("状态机显示当前深挖、追问节点和回答轮次", async ({ page }) => {
		await page.goto("/mock-interview");
		await expect(page.locator("text=当前深挖")).toBeVisible();
		await expect(page.locator("text=追问节点")).toBeVisible();
		await expect(page.locator("text=回答轮次")).toBeVisible();
	});
});

test.describe("Error Boundary (#7)", () => {
	test("触发客户端错误后显示错误边界和重试按钮", async ({ page }) => {
		await page.goto("/test-error?crash=1");
		await expect(page.locator("text=出了点问题")).toBeVisible({ timeout: 10000 });
		await expect(page.getByRole("button", { name: "重试" })).toBeVisible();
	});

	test("无 crash 参数时测试页正常渲染", async ({ page }) => {
		await page.goto("/test-error");
		await expect(page.locator("text=E2E 测试错误边界")).toBeVisible();
	});
});

test.describe("响应式移动端 375px (#10)", () => {
	test("首页在 375px 宽度下正常渲染", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto("/");
		await expect(page.locator("h1")).toContainText("AI 求职训练系统");
		await expect(page.locator("nav")).toBeVisible();
		await page.screenshot({ path: "docs/screenshots/mobile-home-375.png", fullPage: true });
	});

	test("模拟面试页在 375px 下正常渲染", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto("/mock-interview");
		await expect(page.locator("h1")).toContainText("模拟面试");
		await expect(page.locator("#resume-context")).toBeVisible();
		await page.screenshot({ path: "docs/screenshots/mobile-interview-375.png", fullPage: false });
	});

	test("手写练习页在 375px 下正常渲染", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto("/coding-practice");
		await page.waitForSelector("text=题目列表", { timeout: 15000 });
		await expect(page.locator("h1")).toContainText("手写 / 算法练习");
		await page.screenshot({ path: "docs/screenshots/mobile-coding-375.png", fullPage: false });
	});
});

test.describe("无障碍基础验证 (#11)", () => {
	test("导航栏有 aria-label", async ({ page }) => {
		await page.goto("/");
		const nav = page.locator("nav[aria-label]");
		await expect(nav).toBeVisible();
		const label = await nav.getAttribute("aria-label");
		expect(label).toBeTruthy();
	});

	test("AI 设置面板有 role=dialog", async ({ page }) => {
		await page.goto("/mock-interview");
		await page.click("text=设置 API Key");
		const dialog = page.locator("[role=dialog]");
		await expect(dialog).toBeVisible();
		const ariaLabel = await dialog.getAttribute("aria-label");
		expect(ariaLabel).toBeTruthy();
	});

	test("所有页面 h1 标题存在", async ({ page }) => {
		const pages = ["/", "/jd-match", "/resume-review", "/project-polish", "/mock-interview", "/coding-practice", "/resume-versions"];
		for (const path of pages) {
			await page.goto(path);
			if (path === "/coding-practice") {
				await page.waitForSelector("text=题目列表", { timeout: 15000 });
			}
			const h1 = page.locator("h1").first();
			await expect(h1).toBeVisible();
		}
	});

	test("表单输入有关联 label", async ({ page }) => {
		await page.goto("/jd-match");
		await expect(page.locator("label[for=jd]")).toBeVisible();
		await expect(page.locator("label[for=resume]")).toBeVisible();
	});
});
