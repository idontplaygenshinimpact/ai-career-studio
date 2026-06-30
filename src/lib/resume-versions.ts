import type {
	ResumeLine,
	ResumeVersion,
	ResumeVersionSource,
	ResumeVersionScores,
	ResumeSuggestion,
} from "@/data/resume-version-types";
import { loadJson, saveJson } from "@/lib/storage";

const LINE_KEY = "acs_resume_lines";
const VERSION_KEY = "acs_resume_versions";
const MAX_LINES = 10;
const MAX_VERSIONS = 15;
const FINGERPRINT_LEN = 200;
const SIMILARITY_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// Fingerprint: 取前 200 字做标识，用于判断两份简历是否属于同一条线
// ---------------------------------------------------------------------------

export function normalize(text: string): string {
	return text.replace(/\s+/g, "").slice(0, FINGERPRINT_LEN);
}

export function calcFingerprint(text: string): string {
	const norm = normalize(text);
	// FNV-1a 32-bit：offset basis 2166136261，prime 16777619；时间 O(n)、空间 O(1)
	let hash = 2166136261 >>> 0;
	for (let i = 0; i < norm.length; i++) {
		hash ^= norm.charCodeAt(i);
		hash = Math.imul(hash, 16777619) >>> 0;
	}
	return hash.toString(36);
}

export function calcSimilarity(a: string, b: string): number {
	const na = normalize(a);
	const nb = normalize(b);
	if (na.length === 0 || nb.length === 0) return 0;
	if (na === nb) return 1;

	// Levenshtein 编辑距离（Wagner-Fischer），两行滚动数组优化到 O(min(m, n)) 空间
	// 相似度 = 1 - editDistance / max(len_a, len_b)，时间 O(m*n)
	const shorter = na.length <= nb.length ? na : nb;
	const longer = na.length <= nb.length ? nb : na;

	let prevRow = Array.from({ length: shorter.length + 1 }, (_, index) => index);
	let currRow = new Array<number>(shorter.length + 1);

	for (let i = 1; i <= longer.length; i++) {
		currRow[0] = i;
		const longChar = longer.charCodeAt(i - 1);

		for (let j = 1; j <= shorter.length; j++) {
			const cost = longChar === shorter.charCodeAt(j - 1) ? 0 : 1;
			const deletion = prevRow[j] + 1;
			const insertion = currRow[j - 1] + 1;
			const substitution = prevRow[j - 1] + cost;
			currRow[j] = Math.min(deletion, insertion, substitution);
		}

		const temp = prevRow;
		prevRow = currRow;
		currRow = temp;
	}

	const editDistance = prevRow[shorter.length];
	return 1 - editDistance / Math.max(na.length, nb.length);
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function loadResumeLines(): ResumeLine[] {
	return loadJson<ResumeLine[]>(LINE_KEY, []);
}

export function loadResumeVersions(): ResumeVersion[] {
	return loadJson<ResumeVersion[]>(VERSION_KEY, []);
}

export function saveResumeLines(lines: ResumeLine[]) {
	saveJson(LINE_KEY, lines.slice(0, MAX_LINES));
}

export function saveResumeVersions(versions: ResumeVersion[]) {
	saveJson(VERSION_KEY, versions.slice(0, MAX_VERSIONS));
}

export function getVersionsForLine(lineId: string): ResumeVersion[] {
	return loadResumeVersions()
		.filter((v) => v.lineId === lineId)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getLatestVersion(lineId: string): ResumeVersion | null {
	const versions = getVersionsForLine(lineId);
	return versions[0] ?? null;
}

// ---------------------------------------------------------------------------
// 自动归类：根据简历文本找到或创建对应的 ResumeLine
// ---------------------------------------------------------------------------

function findMatchingLine(text: string, lines: ResumeLine[]): ResumeLine | null {
	for (const line of lines) {
		// 先用 fingerprint 快速匹配
		if (line.fingerprint === calcFingerprint(text)) {
			return line;
		}
	}

	// fingerprint 不同（可能内容微调），用相似度兜底
	const versions = loadResumeVersions();
	for (const line of lines) {
		const lineVersions = versions.filter((v) => v.lineId === line.id);
		const latest = lineVersions[0];
		if (latest && calcSimilarity(text, latest.text) >= SIMILARITY_THRESHOLD) {
			return line;
		}
	}

	return null;
}

function generateLineLabel(text: string, source: ResumeVersionSource): string {
	// 从简历前 50 字提取关键词做自动标签
	const snippet = text.slice(0, 50).replace(/\n/g, " ").trim();
	const sourceLabels: Record<ResumeVersionSource, string> = {
		manual: "手动创建",
		"jd-match": "JD 匹配",
		"resume-review": "简历诊断",
		"project-polish": "项目优化",
		"mock-interview": "模拟面试",
	};
	return `${sourceLabels[source]}：${snippet.slice(0, 20)}...`;
}

// ---------------------------------------------------------------------------
// 核心：保存简历版本（自动归类 + 创建版本）
// ---------------------------------------------------------------------------

export function saveResumeVersion(opts: {
	text: string;
	source: ResumeVersionSource;
	model?: string;
	scores?: ResumeVersionScores;
	suggestions?: ResumeSuggestion[];
}): { line: ResumeLine; version: ResumeVersion } {
	const { text, source, model, scores = {}, suggestions = [] } = opts;
	const lines = loadResumeLines();
	const versions = loadResumeVersions();

	let line = findMatchingLine(text, lines);
	let isNewLine = false;

	if (!line) {
		isNewLine = true;
		line = {
			id: `rl-${Date.now().toString(36)}`,
			label: generateLineLabel(text, source),
			fingerprint: calcFingerprint(text),
			createdAt: new Date().toISOString(),
		};
	}

	const lineId = line.id;
	const existingDuplicate = versions.find(
		(v) => v.lineId === lineId && v.source === source && v.text === text,
	);

	if (existingDuplicate) {
		existingDuplicate.scores = { ...existingDuplicate.scores, ...scores };
		if (suggestions.length > 0) {
			existingDuplicate.suggestions = [...existingDuplicate.suggestions, ...suggestions];
		}
		saveResumeVersions(versions);
		return { line, version: existingDuplicate };
	}

	const version: ResumeVersion = {
		id: `rv-${Date.now().toString(36)}`,
		lineId: line.id,
		createdAt: new Date().toISOString(),
		text,
		source,
		model,
		scores,
		suggestions,
	};

	// 保存
	if (isNewLine) {
		saveResumeLines([line, ...lines].slice(0, MAX_LINES));
	}
	saveResumeVersions([version, ...versions].slice(0, MAX_VERSIONS));

	return { line, version };
}

// ---------------------------------------------------------------------------
// 更新最近版本的分数/建议（面试结束后追加）
// ---------------------------------------------------------------------------

export function deleteResumeVersion(versionId: string) {
	const versions = loadResumeVersions().filter((v) => v.id !== versionId);
	saveResumeVersions(versions);
}

// ---------------------------------------------------------------------------
// 建议聚合 + 去重
// ---------------------------------------------------------------------------

export function aggregateSuggestions(lineId: string): ResumeSuggestion[] {
	const versions = getVersionsForLine(lineId);
	const allSuggestions: ResumeSuggestion[] = [];

	for (const version of versions) {
		for (const suggestion of version.suggestions) {
			allSuggestions.push(suggestion);
		}
	}

	// 按内容去重，多次出现的提升优先级
	const countMap = new Map<string, { suggestion: ResumeSuggestion; count: number }>();

	for (const suggestion of allSuggestions) {
		const key = suggestion.content.slice(0, 40);
		const existing = countMap.get(key);
		if (existing) {
			existing.count++;
		} else {
			countMap.set(key, { suggestion, count: 1 });
		}
	}

	return Array.from(countMap.values())
		.map(({ suggestion, count }) => ({
			...suggestion,
			priority: count >= 3 ? "high" as const : count >= 2 ? "medium" as const : suggestion.priority,
		}))
		.sort((a, b) => {
			const order = { high: 0, medium: 1, low: 2 };
			return order[a.priority] - order[b.priority];
		});
}

// ---------------------------------------------------------------------------
// 行级 diff（纯 JS，不引入依赖）
// ---------------------------------------------------------------------------

export type DiffLine = {
	type: "added" | "removed" | "unchanged";
	content: string;
};

export function diffLines(oldText: string, newText: string): DiffLine[] {
	const oldLines = oldText.split("\n");
	const newLines = newText.split("\n");
	const m = oldLines.length;
	const n = newLines.length;

	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			dp[i][j] = oldLines[i - 1] === newLines[j - 1]
				? dp[i - 1][j - 1] + 1
				: Math.max(dp[i - 1][j], dp[i][j - 1]);
		}
	}

	const result: DiffLine[] = [];
	let i = m;
	let j = n;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
			result.push({ type: "unchanged", content: oldLines[i - 1] });
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			result.push({ type: "added", content: newLines[j - 1] });
			j--;
		} else {
			result.push({ type: "removed", content: oldLines[i - 1] });
			i--;
		}
	}

	return result.reverse();
}

// ---------------------------------------------------------------------------
// 更新简历线标签
// ---------------------------------------------------------------------------

export function updateLineLabel(lineId: string, label: string) {
	const lines = loadResumeLines();
	const idx = lines.findIndex((l) => l.id === lineId);
	if (idx < 0) return;
	lines[idx] = { ...lines[idx], label };
	saveResumeLines(lines);
}
