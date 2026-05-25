"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildReview } from "@/lib/analysis";
import { parseResumeFile, supportedResumeFormats } from "@/lib/resume-file";

const sampleResume = `合肥工业大学计算机科学与技术专业大三在读，具备 Vue3 / React / TypeScript 前端开发经验。目前在 AI 数据公司实习，参与 img2code 数据生产链路及标注工具相关开发。项目中实现了 SSE 流式对话、Pinia 状态管理、ECharts 数据看板与工程化自动导入。`;

export function ResumeReviewWorkbench() {
  const [resume, setResume] = useState(sampleResume);
  const [fileStatus, setFileStatus] = useState("支持粘贴文本，也支持上传 .txt / .md / .json / .docx 简历文件。");
  const [isParsing, setIsParsing] = useState(false);
  const review = useMemo(() => buildReview(resume), [resume]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsParsing(true);
    setFileStatus(`正在解析：${file.name}`);

    try {
      const result = await parseResumeFile(file);
      setResume(result.text);
      setFileStatus(result.message);
    } catch (error) {
      setFileStatus(error instanceof Error ? error.message : "文件解析失败，请改为粘贴文本。 ");
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <article className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <label htmlFor="resume-review" className="text-lg font-semibold text-white">简历内容</label>
            <p className="mt-2 text-sm text-slate-500">支持格式：{supportedResumeFormats.join(" / ")}。PDF 可复制文本后粘贴。</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/15">
            {isParsing ? "解析中..." : "上传简历文件"}
            <input
              type="file"
              accept=".txt,.md,.json,.docx,.pdf,.doc"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isParsing}
            />
          </label>
        </div>
        <textarea
          id="resume-review"
          value={resume}
          onChange={(event) => setResume(event.target.value)}
          className="mt-4 min-h-80 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm leading-7 text-slate-200 outline-none focus:border-cyan-300/50"
        />
        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm leading-6 text-slate-400">
          <p>{fileStatus}</p>
          <p>当前字数：{resume.length}。建议补充项目难点、量化结果、上线或展示材料。</p>
        </div>
      </article>

      <article className="rounded-[28px] border border-amber-300/20 bg-amber-300/10 p-6 text-slate-50">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-200/70">Score</p>
            <div className="mt-2 text-5xl font-semibold">{review.score}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
            面试可投递性：{review.score >= 85 ? "强" : review.score >= 75 ? "中上" : "需打磨"}
          </div>
        </div>

        <div className="mt-6 space-y-5 text-sm leading-7 text-slate-200">
          <section>
            <h3 className="font-medium text-white">优势</h3>
            <ul className="mt-2 space-y-2">{review.strengths.map((item) => <li key={item}>• {item}</li>)}</ul>
          </section>
          <section>
            <h3 className="font-medium text-white">风险</h3>
            <ul className="mt-2 space-y-2">{review.risks.map((item) => <li key={item}>• {item}</li>)}</ul>
          </section>
          <section>
            <h3 className="font-medium text-white">优化建议</h3>
            <ul className="mt-2 space-y-2">{review.suggestions.map((item) => <li key={item}>• {item}</li>)}</ul>
          </section>
        </div>

        <Link href="/project-polish" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-amber-100">
          去优化项目描述
        </Link>
      </article>
    </div>
  );
}
