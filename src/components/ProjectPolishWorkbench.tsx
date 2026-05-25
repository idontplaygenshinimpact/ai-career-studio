"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { polishProject } from "@/lib/analysis";

const sampleProject = "做了一个 AI 对话项目，实现 SSE 流式输出、会话管理、Markdown 渲染和消息中断。";

export function ProjectPolishWorkbench() {
  const [project, setProject] = useState(sampleProject);
  const result = useMemo(() => polishProject(project), [project]);

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
      </section>

      <section className="space-y-4">
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
      </section>
    </div>
  );
}
