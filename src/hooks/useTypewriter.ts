import { useEffect, useState } from "react";

export function useTypewriter(text: string, speed = 20): string {
	const [displayed, setDisplayed] = useState("");

	useEffect(() => {
		if (!text) {
			setDisplayed("");
			return;
		}

		setDisplayed("");
		let index = 0;

		const timer = setInterval(() => {
			index += 1;
			setDisplayed(text.slice(0, index));

			if (index >= text.length) {
				clearInterval(timer);
			}
		}, speed);

		return () => clearInterval(timer);
	}, [text, speed]);

	return displayed;
}

export function useTypewriterList(items: string[], speed = 15): string[] {
	const [displayed, setDisplayed] = useState<string[]>([]);

	useEffect(() => {
		if (items.length === 0) {
			setDisplayed([]);
			return;
		}

		setDisplayed([]);
		let itemIndex = 0;
		let charIndex = 0;
		const result: string[] = [];

		const timer = setInterval(() => {
			if (itemIndex >= items.length) {
				clearInterval(timer);
				return;
			}

			charIndex += 1;
			result[itemIndex] = items[itemIndex].slice(0, charIndex);
			setDisplayed([...result]);

			if (charIndex >= items[itemIndex].length) {
				itemIndex += 1;
				charIndex = 0;
			}
		}, speed);

		return () => clearInterval(timer);
	}, [items, speed]);

	return displayed;
}
