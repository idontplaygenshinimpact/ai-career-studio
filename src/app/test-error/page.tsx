"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ErrorTrigger() {
	const params = useSearchParams();

	if (params.get("crash") === "1") {
		throw new Error("E2E 测试触发的错误");
	}

	return <p>此页面仅用于 E2E 测试错误边界。添加 ?crash=1 触发错误。</p>;
}

export default function TestErrorPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
			<Suspense fallback={<p>加载中...</p>}>
				<ErrorTrigger />
			</Suspense>
		</main>
	);
}
