import OpenAI from "openai";
import fs from "fs";
import { MessageType } from "../types/openai";
import { env } from "../env";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

export class OpenAIAdapter {
  private openai: OpenAI;

  roles = {
    ASSISTANT: "assistant",
    USER: "user",
  };

  constructor() {
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.openai = openai;
  }

  async transcription(filepath: string) {
    try {
      const response = await this.openai.audio.transcriptions.create({
        model: "whisper-1",
        file: fs.createReadStream(filepath),
      });
      return response.text;
    } catch (error) {
      console.log("Error while transcription", error.message);
      throw error;
    }
  }

  async chat(messages: MessageType[]) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        messages,
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.log("Error while getting completions:", error);
      throw error;
    }
  }

  async embeddings() {
    try {
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: env.OPENAI_API_KEY,
      });
      return embeddings;
    } catch (error) {
      console.log("Error calling openai embeddings:", error);
      throw error;
    }
  }
}
