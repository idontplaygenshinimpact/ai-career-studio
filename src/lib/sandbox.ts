export type TestResult = {
	passed: boolean;
	label: string;
};

export type SandboxResult = {
	success: boolean;
	tests: TestResult[];
	logs: string[];
	error: string | null;
	duration: number;
};

type WorkerMessage =
	| { type: "done"; tests: TestResult[]; logs: string[] }
	| { type: "error"; message: string; logs: string[] };

const TIMEOUT_MS = 15_000;

const WORKER_TEMPLATE = `
"use strict";

const __logs__ = [];
const __tests__ = [];

const console = {
  log: (...args) => __logs__.push(args.map(String).join(" ")),
  error: (...args) => __logs__.push("[error] " + args.map(String).join(" ")),
  warn: (...args) => __logs__.push("[warn] " + args.map(String).join(" ")),
};

function __sleep__(ms) { return new Promise(r => setTimeout(r, ms)); }

function __assert__(condition, label) {
  __tests__.push({ passed: !!condition, label: label || "unnamed" });
  if (!condition) throw new Error("FAIL: " + (label || "unnamed"));
}

(async () => {
  try {
    // --- user code ---
    __USER_CODE__
    // --- end user code ---

    // --- test code ---
    __TEST_CODE__
    // --- end test code ---

    await __test__(__EXPORT_ARGS__);

    self.postMessage({ type: "done", tests: __tests__, logs: __logs__ });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err && err.message ? err.message : String(err),
      logs: __logs__,
    });
  }
})();
`;

function buildExportArgs(skeleton: string): string {
	const fnNames: string[] = [];

	const funcMatch = skeleton.matchAll(
		/(?:^|\n)\s*function\s+(\w+)/g,
	);
	for (const m of funcMatch) {
		fnNames.push(m[1]);
	}

	const classMatch = skeleton.matchAll(
		/(?:^|\n)\s*class\s+(\w+)/g,
	);
	for (const m of classMatch) {
		fnNames.push(m[1]);
	}

	return fnNames.join(", ");
}

export function runInSandbox(
	userCode: string,
	testCode: string,
	skeleton: string,
): Promise<SandboxResult> {
	return new Promise((resolve) => {
		const start = performance.now();

		const exportArgs = buildExportArgs(skeleton);
		const script = WORKER_TEMPLATE
			.replace("__USER_CODE__", userCode)
			.replace("__TEST_CODE__", testCode)
			.replace("__EXPORT_ARGS__", exportArgs);

		const blob = new Blob([script], { type: "application/javascript" });
		const url = URL.createObjectURL(blob);
		const worker = new Worker(url);

		const timer = window.setTimeout(() => {
			worker.terminate();
			URL.revokeObjectURL(url);
			resolve({
				success: false,
				tests: [],
				logs: [],
				error: `执行超时（${TIMEOUT_MS / 1000} 秒），请检查是否有死循环。`,
				duration: TIMEOUT_MS,
			});
		}, TIMEOUT_MS);

		worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
			clearTimeout(timer);
			worker.terminate();
			URL.revokeObjectURL(url);

			const duration = Math.round(performance.now() - start);
			const msg = event.data;

			if (msg.type === "done") {
				resolve({
					success: msg.tests.every((t) => t.passed),
					tests: msg.tests,
					logs: msg.logs,
					error: null,
					duration,
				});
			} else {
				const failedTests: TestResult[] = msg.logs
					.filter((l) => l.startsWith("[error]"))
					.map((l) => ({ passed: false, label: l }));

				resolve({
					success: false,
					tests: failedTests,
					logs: msg.logs,
					error: msg.message,
					duration,
				});
			}
		};

		worker.onerror = (event) => {
			clearTimeout(timer);
			worker.terminate();
			URL.revokeObjectURL(url);
			resolve({
				success: false,
				tests: [],
				logs: [],
				error: event.message || "Worker 执行异常",
				duration: Math.round(performance.now() - start),
			});
		};
	});
}
