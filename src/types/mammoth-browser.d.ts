declare module "mammoth/mammoth.browser" {
  type MammothInput = {
    arrayBuffer: ArrayBuffer;
  };

  type MammothResult = {
    value: string;
    messages: Array<{
      type: "warning" | "error";
      message: string;
    }>;
  };

  const mammoth: {
    extractRawText(input: MammothInput): Promise<MammothResult>;
  };

  export default mammoth;
}
