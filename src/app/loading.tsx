export default function GlobalLoading() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
			<div className="flex flex-col items-center gap-4">
				<div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-300" />
				<p className="text-sm text-slate-400">加载中...</p>
			</div>
		</main>
	);
}
