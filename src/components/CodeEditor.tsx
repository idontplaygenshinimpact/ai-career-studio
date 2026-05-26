"use client";

import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import { linter, type Diagnostic } from "@codemirror/lint";

const jsLinter = linter((view) => {
	const code = view.state.doc.toString();
	const diagnostics: Diagnostic[] = [];

	try {
		new Function(code);
	} catch (err) {
		if (err instanceof SyntaxError) {
			const match = err.message.match(/^(.*?)(?:\s*\((\d+):(\d+)\))?$/);
			const message = match?.[1] || err.message;
			const line = match?.[2] ? parseInt(match[2], 10) - 1 : 0;
			const col = match?.[3] ? parseInt(match[3], 10) - 1 : 0;
			const lineObj = view.state.doc.line(Math.min(Math.max(line + 1, 1), view.state.doc.lines));
			const from = lineObj.from + Math.min(col, lineObj.length);

			diagnostics.push({
				from,
				to: Math.min(from + 1, lineObj.to),
				severity: "error",
				message,
			});
		}
	}

	return diagnostics;
});

type CodeEditorProps = {
	value: string;
	onChange: (value: string) => void;
	readOnly?: boolean;
};

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const valueRef = useRef(value);
	valueRef.current = value;

	useEffect(() => {
		if (!containerRef.current) return;

		const state = EditorState.create({
			doc: valueRef.current,
			extensions: [
				basicSetup,
				javascript(),
				oneDark,
				closeBrackets(),
				autocompletion({ activateOnTyping: true }),
				jsLinter,
				keymap.of([indentWithTab]),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						onChangeRef.current(update.state.doc.toString());
					}
				}),
				EditorState.readOnly.of(readOnly),
				EditorView.theme({
					"&": {
						fontSize: "13px",
						borderRadius: "16px",
						overflow: "hidden",
					},
					".cm-scroller": {
						fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
					},
					".cm-gutters": {
						borderRight: "none",
					},
				}),
			],
		});

		const view = new EditorView({
			state,
			parent: containerRef.current,
		});

		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, [readOnly]);

	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		const currentDoc = view.state.doc.toString();
		if (currentDoc !== value) {
			view.dispatch({
				changes: { from: 0, to: currentDoc.length, insert: value },
			});
		}
	}, [value]);

	return (
		<div
			ref={containerRef}
			className="overflow-hidden rounded-2xl border border-white/10"
		/>
	);
}
