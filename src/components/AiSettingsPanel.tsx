"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { loadAiSettings, saveAiSettings, type UserAiSettings } from "@/lib/storage";

export function AiSettingsPanel() {
	const [isOpen, setIsOpen] = useState(false);
	const [settings, setSettings] = useState<UserAiSettings>({
		apiKey: "",
		baseUrl: "https://api.deepseek.com/v1",
		model: "deepseek-chat",
	});
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		setSettings(loadAiSettings());
	}, []);

	function handleSave() {
		saveAiSettings(settings);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	}

	function handleClear() {
		const empty: UserAiSettings = { apiKey: "", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" };
		setSettings(empty);
		saveAiSettings(empty);
	}

	const hasKey = settings.apiKey.length > 0;

	return (
		<>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`rounded-full px-4 py-2 text-sm transition-colors ${
					hasKey
						? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15"
						: "border border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/15"
				}`}
			>
				{hasKey ? "AI 已配置" : "设置 API Key"}
			</button>

			{isOpen
				? createPortal(
						<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
						<div role="dialog" aria-label="AI 配置" className="mx-4 w-full max-w-lg rounded-[28px] border border-white/10 bg-slate-950 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.5)]">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold text-white">AI 配置</h2>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
							>
								✕
							</button>
						</div>
						<p className="mt-2 text-xs leading-5 text-slate-400">
							填入你的 API Key 后，所有 AI 功能将使用你自己的额度。支持 DeepSeek、OpenAI 等 OpenAI-compatible 服务。
						</p>

						<div className="mt-5 space-y-4">
							<div>
								<label htmlFor="ai-key" className="text-sm font-medium text-slate-200">
									API Key
								</label>
								<input
									id="ai-key"
									type="password"
									value={settings.apiKey}
									onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
									className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
									placeholder="sk-..."
								/>
							</div>
							<div>
								<label htmlFor="ai-base" className="text-sm font-medium text-slate-200">
									Base URL
								</label>
								<input
									id="ai-base"
									value={settings.baseUrl}
									onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
									className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
									placeholder="https://api.deepseek.com/v1"
								/>
							</div>
							<div>
								<label htmlFor="ai-model" className="text-sm font-medium text-slate-200">
									模型
								</label>
								<input
									id="ai-model"
									value={settings.model}
									onChange={(e) => setSettings({ ...settings, model: e.target.value })}
									className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300/50"
									placeholder="deepseek-chat"
								/>
							</div>
						</div>

						<div className="mt-6 flex gap-3">
							<button
								type="button"
								onClick={handleSave}
								className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
							>
								{saved ? "已保存" : "保存配置"}
							</button>
							<button
								type="button"
								onClick={handleClear}
								className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
							>
								清除配置
							</button>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
							>
								关闭
							</button>
						</div>

						<p className="mt-4 text-xs text-slate-500">
							Key 仅存储在你的浏览器 localStorage 中，通过 HTTPS 请求 header 传递给服务端，不会被持久化到服务器。
						</p>
					</div>
					</div>,
						document.body,
					)
				: null}
		</>
	);
}
