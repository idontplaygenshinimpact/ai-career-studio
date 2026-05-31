import type { CodingChallenge } from "@/data/coding-challenges";

function buildExportArgs(skeleton: string): string {
	const names: string[] = [];
	const funcMatch = skeleton.matchAll(/(?:^|\n)\s*function\s+(\w+)/g);
	for (const match of funcMatch) {
		names.push(match[1]);
	}
	const classMatch = skeleton.matchAll(/(?:^|\n)\s*class\s+(\w+)/g);
	for (const match of classMatch) {
		names.push(match[1]);
	}
	return names.join(", ");
}

export function mergeTestCode(challenge: CodingChallenge, customTest: string) {
	const trimmed = customTest.trim();
	if (!trimmed) return challenge.testCode;
	const exportArgs = buildExportArgs(challenge.skeleton);
	return `${challenge.testCode}\n\nconst __builtInTest__ = __test__;\nasync function __test__(${exportArgs}) {\n  await __builtInTest__(${exportArgs});\n  ${trimmed}\n}`;
}
