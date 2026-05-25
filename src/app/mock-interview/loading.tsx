export default function MockInterviewLoading() {
	return (
		<main className="min-h-screen bg-slate-950 text-slate-100">
			<section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
				<div className="h-32 animate-pulse rounded-[28px] border border-cyan-300/10 bg-cyan-300/5" />
				<div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
					<div className="h-[600px] animate-pulse rounded-[32px] border border-white/5 bg-white/[0.02]" />
					<div className="space-y-5">
						<div className="h-44 animate-pulse rounded-[32px] border border-amber-300/10 bg-amber-300/5" />
						<div className="h-64 animate-pulse rounded-[28px] border border-white/5 bg-white/[0.02]" />
						<div className="h-48 animate-pulse rounded-[28px] border border-cyan-300/10 bg-cyan-300/5" />
					</div>
				</div>
			</section>
		</main>
	);
}
