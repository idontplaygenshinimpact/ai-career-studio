import { ProjectPolishWorkbench } from "@/components/ProjectPolishWorkbench";

export default function ProjectPolishPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Project Polish</p>
          <h1 className="mt-3 text-3xl font-semibold">项目经历优化</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            把原始项目描述转换成更符合大厂前端简历风格的表达，并保留可追问的技术链路。
          </p>
        </header>

        <ProjectPolishWorkbench />
      </section>
    </main>
  );
}
