import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{
			ok: false,
			error:
				"旧 /api/mock-ai 已保留但不再提供模拟面试能力。请使用 /api/interview-ai，它会基于上传/粘贴的真实简历调用真实 AI。",
		},
		{ status: 410 },
	);
}
