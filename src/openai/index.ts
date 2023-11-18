import OpenAI from "openai";
import { OpenAI as AI } from "langchain/llms/openai";
import fs from "fs";
import { MessageType } from "../types/openai";
import { env } from "../env";
import { Document } from "langchain/document";
import { db } from "../db";
import { loadSummarizationChain } from "langchain/chains";
import { logger } from "../logger";

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
      logger.error(`Error while transcription: ${error}`);
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
      logger.error(`Error while getting completions: ${error}`);
      throw error;
    }
  }

  async summarizeDoc(fileId: string) {
    const fildDocs = await db.document.findMany({
      where: {
        fileId: fileId,
      },
    });

    const docs = fildDocs.map((doc) => {
      return new Document({ pageContent: doc.content });
    });

    const model = new AI({
      modelName: "gpt-3.5-turbo",
      temperature: 0,
      openAIApiKey: env.OPENAI_API_KEY,
    });

    const chain = loadSummarizationChain(model, {
      type: "map_reduce",
    });

    // TODO make complite swap to gpt-3.5 model
    try {
      const res = await chain.call({
        input_documents: docs,
      });
      const textPart = fildDocs[0].content.slice(0, 200).replace(/\n/g, "");
      // TODO FIX THIS
      // const language = await detectLanguage(textPart);
      // const text = await getTranslation(res.text, language);
      return res.text;
    } catch (error) {
      logger.error(`Error while summarizing: ${error}`);
      throw error;
    }
  }
}
