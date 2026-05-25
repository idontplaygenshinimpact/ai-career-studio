import { describe, it, expect } from "vitest";
import { parseResumeFile, supportedResumeFormats } from "../resume-file";

describe("supportedResumeFormats", () => {
	it("includes txt, md, json, docx", () => {
		expect(supportedResumeFormats).toContain(".txt");
		expect(supportedResumeFormats).toContain(".md");
		expect(supportedResumeFormats).toContain(".json");
		expect(supportedResumeFormats).toContain(".docx");
	});
});

describe("parseResumeFile", () => {
	it("parses .txt file", async () => {
		const file = new File(["我是一份简历"], "resume.txt", {
			type: "text/plain",
		});
		const result = await parseResumeFile(file);
		expect(result.text).toBe("我是一份简历");
		expect(result.message).toContain("resume.txt");
	});

	it("parses .md file", async () => {
		const file = new File(["# 简历\n内容"], "resume.md", {
			type: "text/markdown",
		});
		const result = await parseResumeFile(file);
		expect(result.text).toContain("简历");
	});

	it("parses .json file", async () => {
		const json = JSON.stringify({ name: "张三", skills: ["React"] });
		const file = new File([json], "resume.json", {
			type: "application/json",
		});
		const result = await parseResumeFile(file);
		expect(result.text).toContain("张三");
	});

	it("throws for .pdf files", async () => {
		const file = new File(["pdf content"], "resume.pdf", {
			type: "application/pdf",
		});
		await expect(parseResumeFile(file)).rejects.toThrow("PDF");
	});

	it("throws for .doc files", async () => {
		const file = new File(["doc content"], "resume.doc", {
			type: "application/msword",
		});
		await expect(parseResumeFile(file)).rejects.toThrow(".doc");
	});

	it("throws for unsupported extensions", async () => {
		const file = new File(["content"], "resume.xlsx", {
			type: "application/vnd.openxmlformats",
		});
		await expect(parseResumeFile(file)).rejects.toThrow(".xlsx");
	});
});
