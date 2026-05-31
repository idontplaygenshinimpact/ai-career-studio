import { codingChallenges } from "@/data/coding-challenges";
import { loadJson, saveJson } from "@/lib/storage";

export { loadJson, saveJson };

export const CODE_STORAGE_KEY = "acs_coding_code_map";
export const CUSTOM_TEST_STORAGE_KEY = "acs_coding_custom_tests";
export const FAVORITE_STORAGE_KEY = "acs_coding_favorites";
export const SNAPSHOT_STORAGE_KEY = "acs_coding_snapshots";
export const ATTEMPT_STORAGE_KEY = "acs_coding_attempts";

export function loadCodeMap(): Record<string, string> {
	const base: Record<string, string> = {};
	for (const c of codingChallenges) {
		base[c.id] = c.skeleton;
	}
	if (typeof window === "undefined") return base;
	try {
		const saved = JSON.parse(localStorage.getItem(CODE_STORAGE_KEY) || "{}") as Record<string, string>;
		for (const [key, value] of Object.entries(saved)) {
			if (typeof value === "string" && value.trim().length > 0) {
				base[key] = value;
			}
		}
	} catch {
		// ignore invalid localStorage payload
	}
	return base;
}

export function saveCodeMap(map: Record<string, string>) {
	if (typeof window === "undefined") return;
	const toSave: Record<string, string> = {};
	for (const challenge of codingChallenges) {
		if (map[challenge.id] && map[challenge.id] !== challenge.skeleton) {
			toSave[challenge.id] = map[challenge.id];
		}
	}
	saveJson(CODE_STORAGE_KEY, toSave);
}
