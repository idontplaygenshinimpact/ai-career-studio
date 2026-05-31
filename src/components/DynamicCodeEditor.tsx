"use client";

import dynamic from "next/dynamic";

const CodeEditor = dynamic(
	() => import("@/components/CodeEditor").then((mod) => mod.CodeEditor),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm text-slate-400">
				编辑器加载中...
			</div>
		),
	},
);

export type DynamicCodeEditorProps = {
	value: string;
	onChange: (value: string) => void;
	readOnly?: boolean;
};

export function DynamicCodeEditor(props: DynamicCodeEditorProps) {
	return <CodeEditor {...props} />;
}
