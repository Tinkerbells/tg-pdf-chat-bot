import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import type { PDFPage } from "../types/pdf";
import { unlinkFile } from "../helpers";
import { logger } from "../logger";
import type { FileType } from "../prismaAdapter";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document, Prisma } from "@prisma/client";
import { Ollama } from "langchain/llms/ollama";
import translate from "translate";
import { db } from "../db";
import {
  RetrievalQAChain,
  loadQAStuffChain,
  loadSummarizationChain,
} from "langchain/chains";
import { Document as langDocument } from "langchain/document";
import { PromptTemplate } from "langchain/prompts";
import { env } from "../env";
import { HuggingFaceInferenceEmbeddings } from "langchain/embeddings/hf";
import { OpenAI } from "langchain/llms/openai";
import { BotContext } from "..";
import { sendLogs } from "../utils";

export class PdfHandler {
  private filePath: string;
  private model: Ollama;
  private embeddings: HuggingFaceInferenceEmbeddings;
  private ctx: BotContext;
  // private model: OpenAI;
  constructor(ctx: BotContext, filePath?: string) {
    const modelName = "orca2:13b";
    const baseUrl = "http://localhost:11434";
    this.ctx = ctx;
    // const embeddings = new OpenAIEmbeddings({
    //   openAIApiKey: env.OPENAI_API_KEY,
    // });
    const embeddings = new HuggingFaceInferenceEmbeddings();

    this.embeddings = embeddings;
    this.filePath = filePath;
    // const model = new OpenAI({
    //   modelName: "gpt-3.5-turbo",
    //   temperature: 0,
    //   openAIApiKey: env.OPENAI_API_KEY,
    // });
    const model = new Ollama({
      baseUrl: baseUrl,
      model: modelName,
    });
    this.model = model;
  }
  check() {
    return this.filePath.split(".").pop().toLowerCase() === "pdf";
  }
  async parse() {
    const loader = new PDFLoader(this.filePath);
    try {
      const pages = (await loader.load()) as PDFPage[];
      await unlinkFile(this.filePath);
      return pages;
    } catch (error) {
      await sendLogs(this.ctx, JSON.stringify(error));
      logger.error(`Error while parsing document ${this.filePath}:`, error);
      throw error;
    }
  }
  async save(file: FileType, sessionId: string) {
    try {
      const { id } = await db.file.create({
        data: {
          name: file.name,
          url: file.url,
          sessionId: sessionId,
        },
      });
      return id;
    } catch (error) {
      await sendLogs(this.ctx, JSON.stringify(error));
      logger.error(`Error while saving file: ${error}`);
    }
  }

  async store(pages: PDFPage[], fileId: string) {
    const vectorStore = PrismaVectorStore.withModel<Document>(db).create(
      this.embeddings,
      {
        prisma: Prisma,
        tableName: "Document",
        vectorColumnName: "vector",
        columns: {
          content: PrismaVectorStore.ContentColumn,
          id: PrismaVectorStore.IdColumn,
        },
      },
    );

    const documents = await Promise.all(pages.map(this.prepareDocument));
    try {
      await vectorStore.addModels(
        await db.$transaction(
          documents.map((content) =>
            db.document.create({
              data: {
                content: content[0].pageContent,
                fileId: fileId,
              },
            }),
          ),
        ),
      );
      logger.info(`Vectors stored for file: ${fileId}`);
    } catch (error) {
      await sendLogs(this.ctx, JSON.stringify(error));
      logger.error(`Error while trying to store doc: ${error}`);
      throw error;
    }
  }

  async matches(message: string, fileId: string) {
    try {
      const vectorStore = PrismaVectorStore.withModel<Document>(db).create(
        this.embeddings,
        {
          prisma: Prisma,
          tableName: "Document",
          vectorColumnName: "vector",
          columns: {
            content: PrismaVectorStore.ContentColumn,
            id: PrismaVectorStore.IdColumn,
          },
          filter: {
            fileId: {
              equals: fileId,
            },
          },
        },
      );
      const results = await vectorStore.similaritySearch(message, 4); // search for 4 docs
      return results;
    } catch (error) {
      await sendLogs(this.ctx, JSON.stringify(error));
      logger.error(`Error while gettings matches: ${error}`);
      throw error;
    }
  }

  async chat(message: string, fileId: string, translateText: boolean) {
    const vectorStore = PrismaVectorStore.withModel<Document>(db).create(
      this.embeddings,
      {
        prisma: Prisma,
        tableName: "Document",
        vectorColumnName: "vector",
        columns: {
          content: PrismaVectorStore.ContentColumn,
          id: PrismaVectorStore.IdColumn,
        },
        filter: {
          fileId: {
            equals: fileId,
          },
        },
      },
    );

    const chain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(this.model),
      retriever: vectorStore.asRetriever(),
      inputKey: "question",
    });

    try {
      const response = await chain.call({
        question: message,
      });

      let text = response.text;

      if (translateText) {
        text = await translate(text, "ru");
      }
      return text;
    } catch (error) {
      await sendLogs(this.ctx, JSON.stringify(error));
      logger.error(`Error while chatting with document: ${error}`);
      throw error;
    }
  }

  async summarize(fileId: string, translateText: boolean) {
    const fildDocs = await db.document.findMany({
      where: {
        fileId: fileId,
      },
    });

    const docs = fildDocs.map((doc) => {
      return new langDocument({ pageContent: doc.content });
    });

    const template = `Write a concise summary of the following:
                      Return your response in bullet points which covers the key points of the text

"{text}"


BULLET POINT SUMMARY:`;

    const prompt = PromptTemplate.fromTemplate(template);

    const chain = loadSummarizationChain(this.model, {
      type: "stuff",
      prompt: prompt,
      verbose: true,
    });

    try {
      const response = await chain.call({
        input_documents: docs,
      });
      let text = response.text;

      if (translateText) {
        text = await translate(text, "ru");
      }
      return text;
    } catch (error) {
      await sendLogs(this.ctx, JSON.stringify(error));
      logger.error(`Error while summarizing: ${error}`);
      throw error;
    }
  }
  private async prepareDocument(page: PDFPage) {
    let { pageContent } = page;
    pageContent = pageContent.replace(/\n/g, "");
    // split the docs
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 256 });
    try {
      const docs = await splitter.createDocuments([pageContent]);
      return docs;
    } catch (error) {
      logger.error(`Error while splitting documents: ${error}`);
    }
  }
}
