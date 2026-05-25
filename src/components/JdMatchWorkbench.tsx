"use client";

import Link from "next/link";
import { useState } from "react";
import type { JdMatchResult } from "@/lib/analysis";
import { copyToClipboard } from "@/lib/export";
import { saveSharedContext, saveNextActions } from "@/lib/storage";
import { fetchWithAiHeaders } from "@/lib/fetch-ai";
import { NextActions } from "@/components/NextActions";

const sampleJd = "前端实习生，熟悉 React / Vue / TypeScript，了解组件化、状态管理、性能优化，有 AI 产品或数据可视化项目经验优先。";
const sampleResume = "合肥工业大学计算机专业，熟悉 Vue3、React、TypeScript，做过 AI Career Studio、AgentChat 流式对话、ECharts 数据看板等项目。";

export function JdMatchWorkbench() {
  const [jd, setJd] = useState(sampleJd);
  const [resume, setResume] = useState(sampleResume);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<JdMatchResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function formatMatchText() {
    if (!result) return "";
    return `JD 匹配分析（${result.score}分）\n\n命中关键词：${result.matchedKeywords.join("、")}\n\n缺失项：\n${result.missingKeywords.map(s => `• ${s}`).join("\n")}\n\n改写建议：\n${result.rewriteAdvice.map(s => `• ${s}`).join("\n")}\n\n面试准备方向：\n${result.interviewDirections.map(s => `• ${s}`).join("\n")}`;
  }

  async function handleCopyResult() {
    const ok = await copyToClipboard(formatMatchText());
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleAnalyze() {
    if (jd.trim().length < 10 || resume.trim().length < 10 || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetchWithAiHeaders("/api/jd-match", {
        method: "POST",
        body: JSON.stringify({ jd, resume }),
      });

      const data = await response.json() as JdMatchResult & { ok?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "JD 匹配请求失败。");
      }

      setResult({
        score: data.score,
        matchedKeywords: data.matchedKeywords,
        missingKeywords: data.missingKeywords,
        rewriteAdvice: data.rewriteAdvice,
        interviewDirections: data.interviewDirections,
      });
      saveSharedContext({ resumeText: resume, jdText: jd });

      const actions = [];
      if (data.missingKeywords && data.missingKeywords.length > 0) {
        actions.push({
          type: "interview-focus" as const,
          label: `去模拟面试重点练缺失方向`,
          context: `重点追问候选人在以下方向的能力：${data.missingKeywords.join("、")}`,
        });
      }
      actions.push({
        type: "polish-project" as const,
        label: "去优化项目描述提高匹配度",
        context: jd,
      });
      saveNextActions(actions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "JD 匹配分析失败，请重试。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="space-y-4 rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-6">
        <div>
          <label htmlFor="jd" className="text-sm font-semibold text-white">目标岗位 JD</label>
          <textarea
            id="jd"
            value={jd}
            onChange={(event) => setJd(event.target.value)}
            className="mt-3 min-h-40 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm leading-7 text-slate-100 outline-none focus:border-amber-300/50"
          />
        </div>
        <div>
          <label htmlFor="resume" className="text-sm font-semibold text-white">我的简历 / 项目材料</label>
          <textarea
            id="resume"
            value={resume}
            onChange={(event) => setResume(event.target.value)}
            className="mt-3 min-h-40 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm leading-7 text-slate-100 outline-none focus:border-cyan-300/50"
          />
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={jd.trim().length < 10 || resume.trim().length < 10 || isAnalyzing}
          className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:hover:translate-y-0"
        >
          {isAnalyzing ? "AI 分析中..." : "开始 AI 匹配分析"}
        </button>

        {error ? (
          <div className="rounded-2xl border border-red-300/25 bg-red-300/10 p-3 text-sm leading-6 text-red-100">
            {error}
          </div>
        ) : null}
      </section>

      <aside className="space-y-5">
        {result ? (
          <>
            <section className="rounded-[32px] border border-amber-300/20 bg-amber-300/10 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Match Score</p>
              <div className="mt-2 text-5xl font-black text-amber-100">{result.score}</div>
              <p className="mt-3 text-sm leading-7 text-amber-50/90">分数由 AI 综合 JD 技能命中、简历覆盖度和缺失关键词分析得出。</p>
            </section>

            <section className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 p-5">
              <h2 className="font-semibold text-white">命中关键词</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.matchedKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">{keyword}</span>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 text-sm leading-7 text-slate-300">
              <h2 className="font-semibold text-white">缺失项与改写建议</h2>
              <ul className="mt-3 space-y-2">
                {result.missingKeywords.map((keyword) => <li key={keyword}>• 需补强：{keyword}</li>)}
                {result.rewriteAdvice.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </section>

            <section className="rounded-[28px] border border-amber-300/15 bg-amber-300/[0.06] p-5 text-sm leading-7 text-slate-300">
              <h2 className="font-semibold text-white">面试准备方向</h2>
              <ul className="mt-3 space-y-2">
                {result.interviewDirections.map((item) => <li key={item}>• {item}</li>)}
              </ul>
              <div className="mt-5 flex gap-3">
                <Link href="/mock-interview" className="inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950">
                  根据匹配结果进入模拟面试
                </Link>
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {copied ? "已复制" : "复制分析结果"}
                </button>
              </div>
            </section>

            <NextActions actions={[
              ...(result.missingKeywords.length > 0 ? [{
                label: "去模拟面试重点练缺失方向",
                description: `AI 将重点追问：${result.missingKeywords.slice(0, 3).join("、")}`,
                href: "/mock-interview",
                color: "cyan" as const,
              }] : []),
              {
                label: "去优化项目描述提高匹配度",
                description: "用 AI 把项目描述改成更匹配 JD 的表达",
                href: "/project-polish",
                color: "emerald" as const,
              },
            ]} />
          </>
        ) : (
          <section className="rounded-[32px] border border-amber-300/20 bg-amber-300/10 p-6">
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="text-5xl font-black text-amber-100/30">—</div>
              <p className="text-sm text-amber-100/60">填写 JD 和简历后，点击「开始 AI 匹配分析」查看结果</p>
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
