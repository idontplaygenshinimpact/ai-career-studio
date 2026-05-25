"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectPolishResult } from "@/lib/analysis";

const sampleProject = "做了一个 AI 对话项目，实现 SSE 流式输出、会话管理、Markdown 渲染和消息中断。";

export function ProjectPolishWorkbench() {
  const [project, setProject] = useState(sampleProject);
  const [isPolishing, setIsPolishing] = useState(false);
  const [result, setResult] = useState<ProjectPolishResult | null>(null);
  const [error, setError] = useState("");

  async function handlePolish() {
    if (project.trim().length < 10 || isPolishing) {
      return;
    }

    setIsPolishing(true);
    setError("");

    try {
      const response = await fetch("/api/project-polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });

      const data = await response.json() as ProjectPolishResult & { ok?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "项目优化请求失败。");
      }

      setResult({
        polished: data.polished,
        highlights: data.highlights,
        followUps: data.followUps,
        resumeBullets: data.resumeBullets,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "项目优化失败，请重试。");
    } finally {
      setIsPolishing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <label htmlFor="project" className="text-lg font-semibold text-white">原始项目描述</label>
        <textarea
          id="project"
          value={project}
          onChange={(event) => setProject(event.target.value)}
          className="mt-4 min-h-72 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm leading-7 text-slate-200 outline-none focus:border-emerald-300/50"
        />
        <button
          type="button"
          onClick={handlePolish}
          disabled={project.trim().length < 10 || isPolishing}
          className="mt-4 rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:translate-y-0"
        >
          {isPolishing ? "AI 优化中..." : "开始 AI 优化"}
        </button>

        {error ? (
          <div className="mt-3 rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm leading-6 text-red-100">
            {error}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        {result ? (
          <>
            <article className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Polished Version</p>
              <h2 className="mt-3 text-xl font-semibold text-white">优化后表达</h2>
              <p className="mt-4 text-sm leading-7 text-slate-200">{result.polished}</p>
            </article>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[24px] border border-white/10 bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">
                <h3 className="font-semibold text-white">亮点拆解</h3>
                <ul className="mt-3 space-y-2">{result.highlights.map((item) => <li key={item}>• {item}</li>)}</ul>
              </article>
              <article className="rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-50">
                <h3 className="font-semibold text-amber-100">面试追问点</h3>
                <ul className="mt-3 space-y-2">{result.followUps.map((item) => <li key={item}>• {item}</li>)}</ul>
              </article>
            </div>

            <article className="rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm leading-7 text-slate-200">
              <h3 className="font-semibold text-white">可放入简历的 bullet</h3>
              <ul className="mt-3 space-y-2">{result.resumeBullets.map((item) => <li key={item}>• {item}</li>)}</ul>
              <Link href="/mock-interview" className="mt-5 inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950">
                用这些追问进入模拟面试
              </Link>
            </article>
          </>
        ) : (
          <article className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-6">
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="text-5xl font-semibold text-emerald-100/30">—</div>
              <p className="text-sm text-emerald-100/60">输入项目描述后，点击「开始 AI 优化」查看结果</p>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
