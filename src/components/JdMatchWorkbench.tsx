"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { matchJd } from "@/lib/analysis";

const sampleJd = "前端实习生，熟悉 React / Vue / TypeScript，了解组件化、状态管理、性能优化，有 AI 产品或数据可视化项目经验优先。";
const sampleResume = "合肥工业大学计算机专业，熟悉 Vue3、React、TypeScript，做过 AI Career Studio、AgentChat 流式对话、ECharts 数据看板等项目。";

export function JdMatchWorkbench() {
  const [jd, setJd] = useState(sampleJd);
  const [resume, setResume] = useState(sampleResume);
  const result = useMemo(() => matchJd(jd, resume), [jd, resume]);

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
      </section>

      <aside className="space-y-5">
        <section className="rounded-[32px] border border-amber-300/20 bg-amber-300/10 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Match Score</p>
          <div className="mt-2 text-5xl font-black text-amber-100">{result.score}</div>
          <p className="mt-3 text-sm leading-7 text-amber-50/90">分数由 JD 技能命中、简历覆盖度和缺失关键词综合计算。</p>
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
          <Link href="/mock-interview" className="mt-5 inline-flex rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950">
            根据匹配结果进入模拟面试
          </Link>
        </section>
      </aside>
    </div>
  );
}
