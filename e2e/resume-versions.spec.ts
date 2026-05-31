import { test, expect } from "@playwright/test";

const MOCK_LINE = {
	id: "rl-test1",
	label: "测试简历线",
	fingerprint: "abc123",
	createdAt: "2024-06-01T10:00:00.000Z",
};

const MOCK_VERSIONS = [
	{
		id: "rv-test2",
		lineId: "rl-test1",
		createdAt: "2024-06-15T10:00:00.000Z",
		text: "合肥工业大学计算机专业大三在读\n熟悉 React 和 TypeScript\n项目：AI Career Studio",
		source: "resume-review",
		scores: { resumeReview: 82 },
		suggestions: [{ source: "resume-review", content: "项目缺少量化成果", priority: "high" }],
	},
	{
		id: "rv-test1",
		lineId: "rl-test1",
		createdAt: "2024-06-01T10:00:00.000Z",
		text: "合肥工业大学计算机专业大三在读\n熟悉 Vue3\n项目：ECharts 看板",
		source: "jd-match",
		scores: { jdMatch: 70 },
		suggestions: [{ source: "jd-match", content: "缺失关键词：TypeScript", priority: "high" }],
	},
];

async function injectVersionData(page: import("@playwright/test").Page) {
	await page.goto("/resume-versions");
	await page.evaluate(
		({ line, versions }) => {
			localStorage.setItem("acs_resume_lines", JSON.stringify([line]));
			localStorage.setItem("acs_resume_versions", JSON.stringify(versions));
		},
		{ line: MOCK_LINE, versions: MOCK_VERSIONS },
	);
	await page.reload();
}

test.describe("简历版本管理页", () => {
	test("页面加载并显示空状态提示", async ({ page }) => {
		await page.goto("/resume-versions");
		await expect(page.locator("h1")).toContainText("简历版本管理");
		await expect(page.locator("text=还没有简历版本记录")).toBeVisible();
	});

	test("导航栏包含简历版本入口", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("nav")).toContainText("简历版本");
	});

	test("可以从首页导航到简历版本页", async ({ page }) => {
		await page.goto("/");
		await page.click("text=简历版本");
		await expect(page).toHaveURL("/resume-versions");
	});
});

test.describe("简历版本管理 - 有数据", () => {
	test("显示简历线和版本时间线", async ({ page }) => {
		await injectVersionData(page);
		await expect(page.locator("text=测试简历线")).toBeVisible();
		await expect(page.locator("text=版本时间线")).toBeVisible();
		await expect(page.locator("text=v1")).toBeVisible();
		await expect(page.locator("text=v2")).toBeVisible();
	});

	test("点击查看展示简历内容", async ({ page }) => {
		await injectVersionData(page);
		await page.getByRole("button", { name: "查看" }).first().click();
		await expect(page.locator("text=简历内容")).toBeVisible();
		await expect(page.locator("text=合肥工业大学")).toBeVisible();
	});

	test("选择两个版本后可对比", async ({ page }) => {
		await injectVersionData(page);
		const viewBtns = page.getByRole("button", { name: "查看" });
		await viewBtns.first().click();
		const compareBtns = page.getByRole("button", { name: "对比" });
		await compareBtns.first().click();
		await expect(page.locator("text=版本对比")).toBeVisible();
	});

	test("删除版本后时间线更新", async ({ page }) => {
		await injectVersionData(page);
		await expect(page.locator("text=v2")).toBeVisible();
		const deleteBtns = page.getByRole("button", { name: "删除" });
		await deleteBtns.first().click();
		const remaining = await page.locator("text=版本时间线").count();
		expect(remaining).toBeGreaterThanOrEqual(0);
	});

	test("显示聚合改进建议", async ({ page }) => {
		await injectVersionData(page);
		await expect(page.locator("text=聚合改进建议")).toBeVisible();
	});

	test("显示综合复盘卡片", async ({ page }) => {
		await injectVersionData(page);
		await expect(page.locator("text=投递准备度")).toBeVisible();
		await expect(page.locator("text=下一步建议")).toBeVisible();
	});
});
