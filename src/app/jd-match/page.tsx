import type { Metadata } from "next";
import { JdMatchWorkbench } from "@/components/JdMatchWorkbench";

export const metadata: Metadata = {
  title: "JD 匹配分析 - AI Career Studio",
  description: "输入目标岗位 JD 和简历材料，AI 分析关键词命中、缺失技能、改写建议和面试准备方向。",
};

export default function JdMatchPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_28%),linear-gradient(180deg,_#06101d_0%,_#050814_100%)] text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">JD Match</p>
          <h1 className="mt-3 text-3xl font-semibold">岗位匹配分析</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
            粘贴目标岗位 JD 和你的简历材料，系统会输出关键词命中、缺失技能、改写建议和面试准备方向。
          </p>
        </header>

        <JdMatchWorkbench />
      </section>
    </main>
  );
}
