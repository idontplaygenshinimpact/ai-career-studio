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
	perf: {
		cpuTimeMs: number;
		heapEstimateKB: number;
		timedOut: boolean;
		memoryExceeded: boolean;
	};
};

type WorkerMessage =
	| { type: "done"; tests: TestResult[]; logs: string[]; cpuTime: number; heapEstimate: number }
	| { type: "error"; message: string; logs: string[]; cpuTime: number; heapEstimate: number }
	| { type: "heartbeat"; cpuTime: number };

const TIMEOUT_MS = 15_000;
const CPU_LIMIT_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 100;
const HEAP_LIMIT_KB = 50_000;

const WORKER_TEMPLATE = `
"use strict";

const __logs__ = [];
const __tests__ = [];
const __startTime__ = performance.now();
let __allocCount__ = 0;

const __originalArray__ = Array;
const __originalObject__ = Object.create;

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

function __getCpuTime__() { return performance.now() - __startTime__; }

function __getHeapEstimate__() {
  if (self.performance && self.performance.memory) {
    return Math.round(self.performance.memory.usedJSHeapSize / 1024);
  }
  return 0;
}

const __heartbeatTimer__ = setInterval(() => {
  const cpu = __getCpuTime__();
  self.postMessage({ type: "heartbeat", cpuTime: cpu });
  if (cpu > ${CPU_LIMIT_MS}) {
    clearInterval(__heartbeatTimer__);
    self.postMessage({
      type: "error",
      message: "CPU 时间超限（" + Math.round(cpu) + "ms），可能存在死循环或低效算法。",
      logs: __logs__,
      cpuTime: cpu,
      heapEstimate: __getHeapEstimate__(),
    });
    self.close();
  }
}, ${HEARTBEAT_INTERVAL_MS});

(async () => {
  try {
    __USER_CODE__

    __TEST_CODE__

    await __test__(__EXPORT_ARGS__);

    clearInterval(__heartbeatTimer__);
    const cpuTime = __getCpuTime__();
    self.postMessage({
      type: "done",
      tests: __tests__,
      logs: __logs__,
      cpuTime: cpuTime,
      heapEstimate: __getHeapEstimate__(),
    });
  } catch (err) {
    clearInterval(__heartbeatTimer__);
    const cpuTime = __getCpuTime__();
    self.postMessage({
      type: "error",
      message: err && err.message ? err.message : String(err),
      logs: __logs__,
      cpuTime: cpuTime,
      heapEstimate: __getHeapEstimate__(),
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
		let lastCpuTime = 0;
		let memoryExceeded = false;

		const exportArgs = buildExportArgs(skeleton);
		const script = WORKER_TEMPLATE
			.replace("__USER_CODE__", userCode)
			.replace("__TEST_CODE__", testCode)
			.replace("__EXPORT_ARGS__", exportArgs);

		const blob = new Blob([script], { type: "application/javascript" });
		const url = URL.createObjectURL(blob);
		const worker = new Worker(url);

		const cleanup = () => {
			worker.terminate();
			URL.revokeObjectURL(url);
		};

		const timer = window.setTimeout(() => {
			cleanup();
			resolve({
				success: false,
				tests: [],
				logs: [],
				error: `执行超时（${TIMEOUT_MS / 1000} 秒），请检查是否有死循环。`,
				duration: TIMEOUT_MS,
				perf: {
					cpuTimeMs: lastCpuTime,
					heapEstimateKB: 0,
					timedOut: true,
					memoryExceeded: false,
				},
			});
		}, TIMEOUT_MS);

		worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
			const msg = event.data;

			if (msg.type === "heartbeat") {
				lastCpuTime = msg.cpuTime;
				return;
			}

			clearTimeout(timer);
			cleanup();

			const duration = Math.round(performance.now() - start);
			const cpuTime = "cpuTime" in msg ? msg.cpuTime : lastCpuTime;
			const heapEstimate = "heapEstimate" in msg ? msg.heapEstimate : 0;

			if (heapEstimate > HEAP_LIMIT_KB) {
				memoryExceeded = true;
			}

			if (msg.type === "done") {
				resolve({
					success: msg.tests.every((t) => t.passed),
					tests: msg.tests,
					logs: msg.logs,
					error: memoryExceeded ? `内存使用过高（${Math.round(heapEstimate / 1024)}MB），请优化空间复杂度。` : null,
					duration,
					perf: {
						cpuTimeMs: Math.round(cpuTime),
						heapEstimateKB: heapEstimate,
						timedOut: false,
						memoryExceeded,
					},
				});
			} else {
				resolve({
					success: false,
					tests: [],
					logs: msg.logs,
					error: msg.message,
					duration,
					perf: {
						cpuTimeMs: Math.round(cpuTime),
						heapEstimateKB: heapEstimate,
						timedOut: false,
						memoryExceeded,
					},
				});
			}
		};

		worker.onerror = (event) => {
			clearTimeout(timer);
			cleanup();
			resolve({
				success: false,
				tests: [],
				logs: [],
				error: event.message || "Worker 执行异常",
				duration: Math.round(performance.now() - start),
				perf: {
					cpuTimeMs: lastCpuTime,
					heapEstimateKB: 0,
					timedOut: false,
					memoryExceeded: false,
				},
			});
		};
	});
}
