export type MessageType = {
  role: "function" | "assistant" | "user" | "system";
  content: string;
};

export interface IOpenAIAdapter<T> {
  chat: (messages: MessageType[]) => Promise<T | undefined>;
  transcription: (filepath: string) => Promise<T | undefined>;
}
