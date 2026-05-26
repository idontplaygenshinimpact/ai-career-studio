import Link from "next/link";
import {
	capabilityMatrix,
	featureCards,
	highlightStats,
	techStack,
	workflowSteps,
} from "@/data/site";

export default function HomePage() {
	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(45,212,191,0.1),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0b1320_45%,_#050814_100%)] text-slate-100">
			<section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 lg:px-10">
				<header className="relative isolate flex flex-col gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:p-10">
					<div className="absolute -right-28 -top-28 -z-10 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
					<div className="absolute bottom-0 right-10 -z-10 h-40 w-40 rotate-45 border border-cyan-300/20" />
					<div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-amber-300/80">
						<span className="rounded-full border border-amber-300/30 px-3 py-1">
							AI Career Studio
						</span>
						<span className="rounded-full border border-cyan-300/30 px-3 py-1">
							求职训练工作台
						</span>
					</div>

					<div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
						<div className="space-y-5">
							<h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
								不做普通聊天，做一套真正能帮你冲大厂的
								<span className="text-amber-300">AI 求职训练系统</span>
							</h1>
							<p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
								面向前端实习 / 校招场景，集成简历诊断、JD
								匹配、项目经历优化和模拟面试追问。
								支持结构化输出、追问链和结果报告，帮助候选人围绕简历材料完成更高质量的求职训练。
							</p>

							<div className="flex flex-wrap gap-3">
								<Link
									href="/mock-interview"
									className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
								>
									立即开始模拟面试
								</Link>
								<Link
									href="/jd-match"
									className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-300/15"
								>
									先做 JD 匹配
								</Link>
								<Link
									href="/resume-review"
									className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
								>
									简历诊断
								</Link>
								<Link
									href="/project-polish"
									className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/10"
								>
									项目优化
								</Link>
							</div>
						</div>

						<div className="grid gap-4 rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-inner shadow-black/30">
							{highlightStats.map((item) => (
								<div
									key={item.label}
									className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
								>
									<div className="text-2xl font-semibold text-white">
										{item.value}
									</div>
									<div className="mt-1 text-sm text-slate-400">
										{item.label}
									</div>
								</div>
							))}
						</div>
					</div>
				</header>

				<section className="grid gap-4 lg:grid-cols-3">
					{capabilityMatrix.map((item) => (
						<article
							key={item.title}
							className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.06] p-6 shadow-[0_18px_60px_rgba(8,145,178,0.08)]"
						>
							<p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">
								{item.value}
							</p>
							<h2 className="mt-3 text-xl font-semibold text-white">
								{item.title}
							</h2>
							<p className="mt-3 text-sm leading-7 text-slate-300">
								{item.description}
							</p>
						</article>
					))}
				</section>

				<section className="grid gap-4 md:grid-cols-3">
					{featureCards.map((card) => (
						<article
							key={card.title}
							className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_12px_50px_rgba(0,0,0,0.22)] backdrop-blur-lg"
						>
							<div className="mb-4 inline-flex rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-medium text-amber-200">
								{card.badge}
							</div>
							<h2 className="text-xl font-semibold text-white">{card.title}</h2>
							<p className="mt-3 text-sm leading-7 text-slate-300">
								{card.description}
							</p>
						</article>
					))}
				</section>

				<section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
					<article className="rounded-[28px] border border-white/10 bg-slate-950/65 p-6">
						<h2 className="text-xl font-semibold text-white">工作流设计</h2>
						<div className="mt-6 space-y-4">
							{workflowSteps.map((step, index) => (
								<div key={step.title} className="flex gap-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-sm font-semibold text-cyan-200">
										{index + 1}
									</div>
									<div>
										<h3 className="font-medium text-white">{step.title}</h3>
										<p className="mt-1 text-sm leading-7 text-slate-400">
											{step.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</article>

					<article className="rounded-[28px] border border-white/10 bg-white/5 p-6">
						<h2 className="text-xl font-semibold text-white">技术栈</h2>
						<div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
							{techStack.map((item, index) => (
								<p key={item}>
									{index + 1}. {item}
								</p>
							))}
						</div>
					</article>
				</section>
			</section>
		</main>
	);
}
