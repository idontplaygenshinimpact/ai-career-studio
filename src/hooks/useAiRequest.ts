"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AiRequestError, fetchWithAiHeaders, type FetchWithAiHeadersInit } from "@/lib/fetch-ai";

type AiRequestState = {
	isLoading: boolean;
	error: string;
	status: string;
};

type RunOptions = Omit<FetchWithAiHeadersInit, "onRetry" | "signal"> & {
	onRetry?: (attempt: number, reason: string) => void;
	status?: string;
};

export function useAiRequest() {
	const [state, setState] = useState<AiRequestState>({
		isLoading: false,
		error: "",
		status: "",
	});
	const controllerRef = useRef<AbortController | null>(null);

	const cancel = useCallback((message = "已取消 AI 请求") => {
		controllerRef.current?.abort();
		controllerRef.current = null;
		setState((prev) => ({ ...prev, isLoading: false, status: message }));
	}, []);

	const run = useCallback(async (url: string, options: RunOptions = {}) => {
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;
		setState({ isLoading: true, error: "", status: options.status || "AI 请求处理中..." });

		try {
			const response = await fetchWithAiHeaders(url, {
				...options,
				signal: controller.signal,
				onRetry: (attempt, reason) => {
					if (controllerRef.current !== controller) return;
					setState((prev) => ({ ...prev, status: `第 ${attempt} 次重试：${reason}` }));
					options.onRetry?.(attempt, reason);
				},
			});

			if (controllerRef.current !== controller) {
				return null;
			}

			setState((prev) => ({ ...prev, isLoading: false, status: "AI 请求完成" }));
			return response;
		} catch (error) {
			if (controllerRef.current !== controller) {
				return null;
			}

			const message = error instanceof AiRequestError
				? error.message
				: error instanceof Error
					? error.message
					: "AI 请求失败";
			setState({ isLoading: false, error: message, status: "" });
			return null;
		} finally {
			if (controllerRef.current === controller) {
				controllerRef.current = null;
			}
		}
	}, []);

	useEffect(() => () => {
		controllerRef.current?.abort();
	}, []);

	return {
		...state,
		run,
		cancel,
		setStatus: (status: string) => setState((prev) => ({ ...prev, status })),
		setError: (error: string) => setState((prev) => ({ ...prev, error })),
	};
}
