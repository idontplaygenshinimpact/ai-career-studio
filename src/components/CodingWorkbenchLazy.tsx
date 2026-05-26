"use client";

import dynamic from "next/dynamic";

const CodingWorkbench = dynamic(
	() => import("@/components/CodingWorkbench").then((m) => m.CodingWorkbench),
	{ ssr: false },
);

export function CodingWorkbenchLazy() {
	return <CodingWorkbench />;
}
