export const supportedResumeFormats = [".txt", ".md", ".json", ".docx"];

export type ResumeFileResult = {
  text: string;
  message: string;
};

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

function normalizeJsonResume(raw: string) {
  const value = JSON.parse(raw) as unknown;
  return JSON.stringify(value, null, 2);
}

export async function parseResumeFile(file: File): Promise<ResumeFileResult> {
  const extension = getExtension(file.name);

  if (extension === ".pdf") {
    throw new Error("当前 Mock 版本暂不直接解析 PDF。请复制 PDF 文本，或转为 .docx / .txt 后上传。");
  }

  if (extension === ".doc") {
    throw new Error("暂不支持旧版 .doc 格式。请另存为 .docx 后上传。");
  }

  if (extension === ".docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.default.extractRawText({ arrayBuffer: buffer });
    const text = result.value.trim();

    if (!text) {
      throw new Error("没有从 Word 文件中提取到可分析文本，请检查文件内容。");
    }

    return {
      text,
      message: `已解析 Word 简历：${file.name}`,
    };
  }

  if (extension === ".txt" || extension === ".md" || extension === "") {
    const text = (await file.text()).trim();
    return {
      text,
      message: `已读取文本简历：${file.name}`,
    };
  }

  if (extension === ".json") {
    const text = normalizeJsonResume(await file.text());
    return {
      text,
      message: `已读取 JSON 简历：${file.name}`,
    };
  }

  throw new Error(`暂不支持 ${extension || "未知"} 格式。支持：${supportedResumeFormats.join("、")}。`);
}
