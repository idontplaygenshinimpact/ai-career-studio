"use client";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
			<div className="mx-4 max-w-lg rounded-[28px] border border-red-300/20 bg-red-300/10 p-8 text-center">
				<h2 className="text-2xl font-semibold text-white">出了点问题</h2>
				<p className="mt-4 text-sm leading-7 text-slate-300">
					{error.message || "页面加载失败，请重试。"}
				</p>
				<button
					type="button"
					onClick={reset}
					className="mt-6 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
				>
					重试
				</button>
			</div>
		</main>
	);
}
