export function downloadMarkdown(content: string, filename: string) {
	const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export async function downloadPdf(element: HTMLElement, filename: string) {
	const html2canvas = (await import("html2canvas-pro")).default;
	const { jsPDF } = await import("jspdf");

	const canvas = await html2canvas(element, {
		backgroundColor: "#0b1320",
		scale: 2,
		useCORS: true,
	});

	const imgData = canvas.toDataURL("image/png");
	const imgWidth = 210;
	const imgHeight = (canvas.height * imgWidth) / canvas.width;
	const pdf = new jsPDF("p", "mm", "a4");

	let position = 0;
	const pageHeight = 297;

	if (imgHeight <= pageHeight) {
		pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
	} else {
		while (position < imgHeight) {
			pdf.addImage(imgData, "PNG", 0, -position, imgWidth, imgHeight);
			position += pageHeight;
			if (position < imgHeight) {
				pdf.addPage();
			}
		}
	}

	pdf.save(filename);
}
