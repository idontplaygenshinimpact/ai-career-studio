import type { Metadata } from "next";
import { CodingWorkbenchLazy } from "@/components/CodingWorkbenchLazy";

export const metadata: Metadata = {
	title: "手写练习 - AI Career Studio",
	description: "91 道前端高频手写题和算法题，浏览器端代码编辑器 + 沙箱运行 + AI 代码审查，限时练习提升编码能力。",
};

export default function CodingPracticePage() {
	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_25%),linear-gradient(180deg,_#06101d_0%,_#050814_100%)] text-slate-100">
			<section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
				<header className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-6 backdrop-blur-xl">
					<p className="text-xs uppercase tracking-[0.35em] text-emerald-200/80">
						Coding Practice
					</p>
					<h1 className="mt-3 text-3xl font-semibold">手写 / 算法练习</h1>
					<p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
						91 道前端实习高频手写题和算法题，在浏览器端编写代码并运行测试用例。通过后可请求 AI 审查代码质量，获得正确性、边界处理、复杂度和风格四维评分。
					</p>
				</header>

				<CodingWorkbenchLazy />
			</section>
		</main>
	);
}
