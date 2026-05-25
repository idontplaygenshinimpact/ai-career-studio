"use client";

import Link from "next/link";

type ActionCardProps = {
	label: string;
	description: string;
	href: string;
	color: "amber" | "cyan" | "emerald";
};

const colorMap = {
	amber: "border-amber-300/25 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15",
	cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15",
	emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15",
};

export function NextActionCard({ label, description, href, color }: ActionCardProps) {
	return (
		<Link
			href={href}
			className={`block rounded-2xl border p-4 transition-colors ${colorMap[color]}`}
		>
			<p className="text-sm font-semibold">{label}</p>
			<p className="mt-1 text-xs leading-5 opacity-75">{description}</p>
		</Link>
	);
}

type NextActionsProps = {
	actions: Array<{
		label: string;
		description: string;
		href: string;
		color: "amber" | "cyan" | "emerald";
	}>;
	title?: string;
};

export function NextActions({ actions, title = "推荐下一步" }: NextActionsProps) {
	if (actions.length === 0) return null;

	return (
		<div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
			<p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
			<div className="mt-3 grid gap-3 sm:grid-cols-2">
				{actions.map((action) => (
					<NextActionCard key={action.href + action.label} {...action} />
				))}
			</div>
		</div>
	);
}
