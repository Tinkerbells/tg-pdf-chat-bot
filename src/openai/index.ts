import OpenAI from "openai";
import { OpenAI as AI } from "langchain/llms/openai";
import axios from "axios";
import { env } from "../env";
import { Document } from "langchain/document";
import { db } from "../db";
import { loadSummarizationChain } from "langchain/chains";
import { logger } from "../logger";
import { PromptTemplate } from "langchain/prompts";
import { ChatCompletionMessageParam } from "openai/resources";
import { sendLogs } from "../utils";
import { BotContext } from "..";

export class OpenAIAdapter {
  private openai: OpenAI;
  private ctx: BotContext;

  roles = {
    ASSISTANT: "assistant",
    USER: "user",
  };

  constructor(ctx: BotContext) {
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.openai = openai;
    this.ctx = ctx;
  }

  async transcription(filepath: string) {
    interface Response {
      text: string;
    }
    try {
      const response = await axios.post<Response>(
        `${env.API_URL}/get_transcription`,
        {
          file_path: filepath,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      return response.data.text;
    } catch (error) {
      await sendLogs(this.ctx, JSON.stringify(error));
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
    const messages = [
      { role: "user", content: content },
    ] as ChatCompletionMessageParam[];
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

  async assistant(question: string, filePath: string) {
    // const file = await this.openai.files.create({
    //   file: fs.createReadStream(filePath),
    //   purpose: "assistants",
    // });
    // console.log("File:", file);
    const thread = await this.openai.beta.threads.create();
    console.log(thread);
    const message = await this.openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: question,
      file_ids: ["file-GPx7rVqXc8Ao79kbqm1kFXZ1"],
    });
    const run = await this.openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_tLwgVLykzssmd1iyhFr0qbAf",
    });
    while (true) {
      const runRetrieve = await this.openai.beta.threads.runs.retrieve(
        thread.id,
        run.id,
      );
      if (runRetrieve.status === "completed") {
        break;
      }
    }
    const messages = await this.openai.beta.threads.messages.list(thread.id);
    let result = [];
    messages.data.forEach((message) => {
      if (message.role === "assistant") {
        result.push(message.content);
      }
      console.log("Message", message.role, message.content);
    });
    return result;
  }

  async chat(messages: ChatCompletionMessageParam[]) {
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
