export type DimensionKey = "accuracy" | "structure" | "depth" | "riskHandling" | "reviewMindset";

export type DimensionDef = {
	key: DimensionKey;
	label: string;
	max: number;
};

export const DIMENSION_LABELS: DimensionDef[] = [
	{ key: "accuracy", label: "准确性", max: 30 },
	{ key: "structure", label: "结构", max: 25 },
	{ key: "depth", label: "深度", max: 25 },
	{ key: "riskHandling", label: "边界", max: 20 },
	{ key: "reviewMindset", label: "复盘", max: 15 },
];
