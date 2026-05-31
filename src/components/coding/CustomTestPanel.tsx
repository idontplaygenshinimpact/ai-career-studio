type CustomTestPanelProps = {
	value: string;
	onChange: (value: string) => void;
	onClear: () => void;
};

export function CustomTestPanel({ value, onChange, onClear }: CustomTestPanelProps) {
	return (
		<div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/55 p-4">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h3 className="text-sm font-semibold text-white">自定义测试用例</h3>
					<p className="mt-1 text-xs leading-5 text-slate-400">
						可直接使用题目函数名和内置 `__assert__`，会在官方用例后执行。
					</p>
				</div>
				<button
					type="button"
					onClick={onClear}
					className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300 hover:text-white"
				>
					清空
				</button>
			</div>
			<textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="mt-3 min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-xs leading-5 text-slate-200 outline-none focus:border-cyan-300/50"
				placeholder="例如：__assert__(typeof debounce === 'function', '应返回函数');"
			/>
		</div>
	);
}
