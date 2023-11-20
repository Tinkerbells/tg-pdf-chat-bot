import OpenAI from "openai";
import { OpenAI as AI } from "langchain/llms/openai";
import fs from "fs";
import { MessageType } from "../types/openai";
import { env } from "../env";
import { Document } from "langchain/document";
import { db } from "../db";
import { loadSummarizationChain } from "langchain/chains";
import { logger } from "../logger";
import { PromptTemplate } from "langchain/prompts";

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

  async translate(message: string, text: string) {
    const content = `Detect language to this message ${message} and translate text to it

START TEXT BLOCK
${text}
END TEXT BLOCK

Answer:`;
    const messages = [{ role: "user", content: content }] as MessageType[];
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        messages,
      });
      return response.choices[0].message.content;
    } catch (error) {
      logger.error(`Error while getting translation: ${error}`);
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

    const template = `Write a concise summary of the following:
                      Return your response in bullet points which covers the key points of the text

"{text}"


BULLET POINT SUMMARY:`;

    const prompt = PromptTemplate.fromTemplate(template);

    const chain = loadSummarizationChain(model, {
      type: "map_reduce",
      combinePrompt: prompt,
    });

    try {
      const res = await chain.call({
        input_documents: docs,
      });
      return res.text;
    } catch (error) {
      logger.error(`Error while summarizing: ${error}`);
      throw error;
    }
  }
}
