import { ResumeReviewWorkbench } from "@/components/ResumeReviewWorkbench";

export default function ResumeReviewPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Resume Review</p>
          <h1 className="mt-3 text-3xl font-semibold">简历诊断</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            这个页面用于展示 AI Career Studio 的第一类核心能力：把简历内容转成结构化评分、风险点和优化建议。
          </p>
        </header>

        <ResumeReviewWorkbench />
      </section>
    </main>
  );
}
