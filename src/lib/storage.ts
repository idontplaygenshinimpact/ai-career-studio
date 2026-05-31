const STORAGE_PREFIX = "acs_";

function getItem<T>(key: string): T | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_PREFIX + key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

function setItem(key: string, value: unknown) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
	} catch {
		// quota exceeded
	}
}

export function loadJson<T>(key: string, fallback: T): T {
	if (typeof window === "undefined") return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

export function saveJson(key: string, value: unknown) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// quota exceeded
	}
}

export function saveResumeText(text: string) {
	setItem("resume_text", text);
}

export function loadResumeText(): string {
	return getItem<string>("resume_text") || "";
}

export function saveJdText(text: string) {
	setItem("jd_text", text);
}

export function loadJdText(): string {
	return getItem<string>("jd_text") || "";
}

export type SharedContext = {
	resumeText: string;
	jdText: string;
	position: string;
};

export function saveSharedContext(ctx: Partial<SharedContext>) {
	const existing = loadSharedContext();
	setItem("shared_context", { ...existing, ...ctx });
}

export function loadSharedContext(): SharedContext {
	return getItem<SharedContext>("shared_context") || {
		resumeText: "",
		jdText: "",
		position: "",
	};
}

export type InterviewRecord = {
	id: string;
	date: string;
	position: string;
	mode: "practice" | "auto";
	averageScore: number;
	roundCount: number;
	reportMarkdown: string;
	reviewSummary: string;
	dimensions?: {
		accuracy: number;
		structure: number;
		depth: number;
		riskHandling: number;
		reviewMindset: number;
	};
};

const MAX_HISTORY = 20;

export function saveInterviewRecord(record: InterviewRecord) {
	const history = loadInterviewHistory();
	const updated = [record, ...history.filter((r) => r.id !== record.id)].slice(
		0,
		MAX_HISTORY,
	);
	setItem("interview_history", updated);
}

export function loadInterviewHistory(): InterviewRecord[] {
	return getItem<InterviewRecord[]>("interview_history") || [];
}

export function deleteInterviewRecord(id: string) {
	const history = loadInterviewHistory();
	setItem(
		"interview_history",
		history.filter((r) => r.id !== id),
	);
}

export type UserAiSettings = {
	apiKey: string;
	baseUrl: string;
	model: string;
};

export function saveAiSettings(settings: UserAiSettings) {
	setItem("ai_settings", settings);
}

export function loadAiSettings(): UserAiSettings {
	return getItem<UserAiSettings>("ai_settings") || {
		apiKey: "",
		baseUrl: "https://api.deepseek.com/v1",
		model: "deepseek-chat",
	};
}

export type NextAction = {
	type: "interview-focus" | "polish-project" | "retry-weakness";
	label: string;
	context: string;
};

export function saveNextActions(actions: NextAction[]) {
	setItem("next_actions", actions);
}

export function loadNextActions(): NextAction[] {
	return getItem<NextAction[]>("next_actions") || [];
}

export function clearNextActions() {
	setItem("next_actions", []);
}
