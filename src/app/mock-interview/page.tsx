import type { Metadata } from "next";
import { InterviewTrainer } from "@/components/InterviewTrainer";
import { InterviewHistory } from "@/components/interview/InterviewHistory";
import { ProgressTracker } from "@/components/interview/ProgressTracker";
import { TrainingDashboard } from "@/components/TrainingDashboard";

export const metadata: Metadata = {
  title: "模拟面试 - AI Career Studio",
  description: "上传简历，AI 面试官进行多轮追问，支持练习和连贯追问双模式，生成动态评分和个性化复盘报告。",
};

export default function MockInterviewPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_25%),linear-gradient(180deg,_#06101d_0%,_#050814_100%)] text-slate-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Real Interview</p>
          <h1 className="mt-3 text-3xl font-semibold">模拟面试追问</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">
            上传或粘贴简历后，系统会先解析项目、实习和技能线索，再由 AI 面试官围绕项目、基础、工程化和边界情况不断深挖。
          </p>
        </header>

        <InterviewTrainer />
        <TrainingDashboard />
        <ProgressTracker />
        <InterviewHistory />
      </section>
    </main>
  );
}
