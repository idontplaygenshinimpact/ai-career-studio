"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectPolishResult } from "@/lib/analysis";
import { useTypewriter, useTypewriterList } from "@/hooks/useTypewriter";
import { useAiRequest } from "@/hooks/useAiRequest";
import { copyToClipboard } from "@/lib/export";
import { saveResumeVersion } from "@/lib/resume-versions";
import { saveNextActions, saveSharedContext } from "@/lib/storage";

const sampleProject = "做了一个 AI 对话项目，实现 SSE 流式输出、会话管理、Markdown 渲染和消息中断。";

export function ProjectPolishWorkbench() {
  const [project, setProject] = useState(sampleProject);
  const [result, setResult] = useState<ProjectPolishResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const ai = useAiRequest();

  const animatedPolished = useTypewriter(result?.polished || "", 12);
  const animatedHighlights = useTypewriterList(result?.highlights || []);
  const animatedFollowUps = useTypewriterList(result?.followUps || []);
  const animatedBullets = useTypewriterList(result?.resumeBullets || []);

  async function handlePolish() {
    if (project.trim().length < 10 || ai.isLoading) {
      return;
    }

    const response = await ai.run("/api/project-polish", {
      method: "POST",
      timeoutMs: 30_000,
      retries: 1,
      status: "AI 优化中...",
      body: JSON.stringify({ project }),
    });

    if (!response) return;
    const data = await response.json() as ProjectPolishResult & { ok?: boolean; error?: string };

    if (!response.ok) {
      ai.setError(data.error || "项目优化请求失败。");
      return;
    }

    setResult({
      polished: data.polished,
      highlights: data.highlights,
      followUps: data.followUps,
      resumeBullets: data.resumeBullets,
    });
    setSaved(false);
    setCopied(false);
  }

  function buildVersionText(current: ProjectPolishResult) {
    return [
      current.polished,
      "",
      "简历 bullet：",
      ...current.resumeBullets.map((item) => `- ${item}`),
      "",
      "面试追问点：",
      ...current.followUps.map((item) => `- ${item}`),
    ].join("\n");
  }

  function persistPolishResult(current: ProjectPolishResult) {
    if (saved) return;
    const versionText = buildVersionText(current);
    saveResumeVersion({
      text: versionText,
      source: "project-polish",
      suggestions: [
        ...current.highlights.map((item) => ({
          source: "project-polish" as const,
          content: item,
          priority: "medium" as const,
        })),
        ...current.followUps.map((item) => ({
          source: "project-polish" as const,
          content: `面试追问：${item}`,
          priority: "medium" as const,
        })),
      ],
    });
    saveSharedContext({ resumeText: versionText });
    saveNextActions([
      {
        type: "interview-focus",
        label: "用优化后的项目描述开始模拟面试",
        context: current.followUps.length > 0
          ? `重点围绕这些项目追问点展开：${current.followUps.join("；")}`
          : current.polished,
      },
    ]);
    setSaved(true);
  }

  async function handleCopyBullets() {
    if (!result) return;
    const ok = await copyToClipboard(result.resumeBullets.map((item) => `- ${item}`).join("\n"));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          disabled={project.trim().length < 10 || ai.isLoading}
          className="mt-4 rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:translate-y-0"
        >
          {ai.isLoading ? "AI 优化中..." : "开始 AI 优化"}
        </button>

        {ai.error ? (
          <div className="mt-3 rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm leading-6 text-red-100">
            {ai.error}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        {result ? (
          <>
            <article className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/10 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Polished Version</p>
              <h2 className="mt-3 text-xl font-semibold text-white">优化后表达</h2>
              <p className="mt-4 text-sm leading-7 text-slate-200">{animatedPolished}</p>
            </article>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[24px] border border-white/10 bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">
                <h3 className="font-semibold text-white">亮点拆解</h3>
                <ul className="mt-3 space-y-2">{animatedHighlights.map((item) => <li key={item}>• {item}</li>)}</ul>
              </article>
              <article className="rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-50">
                <h3 className="font-semibold text-amber-100">面试追问点</h3>
                <ul className="mt-3 space-y-2">{animatedFollowUps.map((item) => <li key={item}>• {item}</li>)}</ul>
              </article>
            </div>

            <article className="rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm leading-7 text-slate-200">
              <h3 className="font-semibold text-white">可放入简历的 bullet</h3>
              <ul className="mt-3 space-y-2">{animatedBullets.map((item) => <li key={item}>• {item}</li>)}</ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => persistPolishResult(result)}
                  className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  {saved ? "已保存到简历版本" : "保存为简历版本"}
                </button>
                <Link
                  href="/mock-interview"
                  onClick={() => persistPolishResult(result)}
                  className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
                >
                  带追问点进入模拟面试
                </Link>
                <button
                  type="button"
                  onClick={handleCopyBullets}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {copied ? "已复制" : "复制简历 bullet"}
                </button>
              </div>
              {saved ? (
                <p className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs text-emerald-100">
                  已写入简历版本管理，并把优化后的项目描述和追问点同步到模拟面试上下文。
                </p>
              ) : null}
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
