export default function ProjectPolishLoading() {
	return (
		<main className="min-h-screen bg-slate-950 text-slate-100">
			<section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
				<div className="h-32 animate-pulse rounded-[28px] border border-white/5 bg-white/[0.02]" />
				<div className="grid gap-6 lg:grid-cols-2">
					<div className="h-72 animate-pulse rounded-[28px] border border-white/5 bg-white/[0.02]" />
					<div className="space-y-4">
						<div className="h-40 animate-pulse rounded-[28px] border border-emerald-300/10 bg-emerald-300/5" />
						<div className="h-40 animate-pulse rounded-[28px] border border-white/5 bg-white/[0.02]" />
					</div>
				</div>
			</section>
		</main>
	);
}
