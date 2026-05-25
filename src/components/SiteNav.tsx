import Link from "next/link";
import { navItems } from "@/data/site";
import { AiSettingsPanel } from "@/components/AiSettingsPanel";

export function SiteNav() {
  return (
    <nav aria-label="主导航" className="border-b border-white/10 bg-slate-950/85 px-6 py-4 text-slate-100 backdrop-blur-xl lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/15 text-sm font-black text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.18)]">
            AI
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.28em] text-white transition-colors group-hover:text-amber-200">
              CAREER STUDIO
            </span>
            <span className="block text-xs text-slate-500">求职训练作战室</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 text-sm text-slate-300 shadow-inner shadow-black/20">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full px-4 py-2 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <AiSettingsPanel />
        </div>
      </div>
    </nav>
  );
}
