import { useCallback, useEffect, useRef, useState } from "react";

type SpeechStatus = "idle" | "listening" | "unsupported";

type UseSpeechRecognitionReturn = {
	status: SpeechStatus;
	transcript: string;
	start: () => void;
	stop: () => void;
	isListening: boolean;
	isSupported: boolean;
};

type SpeechRecognitionEvent = {
	results: {
		[index: number]: {
			[index: number]: { transcript: string };
			isFinal: boolean;
		};
		length: number;
	};
};

type SpeechRecognitionInstance = {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onend: (() => void) | null;
	onerror: (() => void) | null;
	start: () => void;
	stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
	if (typeof window === "undefined") return null;
	const w = window as unknown as Record<string, unknown>;
	return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
		| (new () => SpeechRecognitionInstance)
		| null;
}

export function useSpeechRecognition(
	onTranscript: (text: string) => void,
	lang = "zh-CN",
): UseSpeechRecognitionReturn {
	const [status, setStatus] = useState<SpeechStatus>("idle");
	const [transcript, setTranscript] = useState("");
	const [isSupported, setIsSupported] = useState(false);
	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
	const onTranscriptRef = useRef(onTranscript);
	onTranscriptRef.current = onTranscript;

	const start = useCallback(() => {
		const SpeechRecognitionClass = getSpeechRecognition();
		if (!SpeechRecognitionClass) {
			setStatus("unsupported");
			return;
		}

		if (recognitionRef.current) {
			recognitionRef.current.stop();
		}

		const recognition = new SpeechRecognitionClass();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = lang;

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			let finalText = "";
			let interimText = "";

			for (let i = 0; i < event.results.length; i++) {
				const result = event.results[i];
				if (result.isFinal) {
					finalText += result[0].transcript;
				} else {
					interimText += result[0].transcript;
				}
			}

			const combined = finalText + interimText;
			setTranscript(combined);

			if (finalText) {
				onTranscriptRef.current(finalText);
			}
		};

		recognition.onend = () => {
			setStatus("idle");
			recognitionRef.current = null;
		};

		recognition.onerror = () => {
			setStatus("idle");
			recognitionRef.current = null;
		};

		recognitionRef.current = recognition;
		recognition.start();
		setStatus("listening");
		setTranscript("");
	}, [lang]);

	const stop = useCallback(() => {
		if (recognitionRef.current) {
			recognitionRef.current.stop();
			recognitionRef.current = null;
		}
		setStatus("idle");
	}, []);

	useEffect(() => {
		setIsSupported(getSpeechRecognition() !== null);
	}, []);

	useEffect(() => {
		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		};
	}, []);

	return {
		status,
		transcript,
		start,
		stop,
		isListening: status === "listening",
		isSupported,
	};
}
