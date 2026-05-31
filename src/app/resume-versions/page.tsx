import type { Metadata } from "next";
import { ResumeVersionsWorkbench } from "@/components/ResumeVersionsWorkbench";

export const metadata: Metadata = {
	title: "简历版本管理 - AI Career Studio",
	description: "追踪简历改进轨迹，查看多版本对比、质量趋势和综合复盘建议。",
};

export default function ResumeVersionsPage() {
	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_28%),linear-gradient(180deg,_#07111f_0%,_#0b1320_45%,_#050814_100%)] text-slate-100">
			<section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
				<header className="rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-6 backdrop-blur-xl">
					<p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Resume Versions</p>
					<h1 className="mt-3 text-3xl font-semibold">简历版本管理</h1>
					<p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
						追踪简历的改进轨迹，查看每个版本的质量评分和 AI 改进建议，对比不同版本的变化。
					</p>
				</header>

				<ResumeVersionsWorkbench />
			</section>
		</main>
	);
}
