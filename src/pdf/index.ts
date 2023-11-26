import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import type { PDFPage } from "../types/pdf";
import { unlinkFile } from "../helpers";
import { logger } from "../logger";
import type { FileType } from "../prismaAdapter";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
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
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";
import { BotContext } from "..";
import { sendLogs } from "../utils";

export class PdfHandler {
  private filePath: string;
  private main: Ollama;
  private context: Ollama;
  private embeddings: HuggingFaceTransformersEmbeddings;
  private ctx: BotContext;
  constructor(ctx: BotContext, filePath?: string) {
    const main = {
      name: "orca2:13b",
      url: "http://localhost:11434",
    };
    const context = {
      name: "mistral",
      url: "http://localhost:11435",
    };
    this.ctx = ctx;
    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });

    this.embeddings = embeddings;
    this.filePath = filePath;

    const mainModel = new Ollama({
      baseUrl: main.url,
      model: main.name,
      temperature: 0,
      topK: 0,
      topP: 0.95,
    });

    const contextModel = new Ollama({
      baseUrl: context.url,
      model: context.name,
      temperature: 0,
      topK: 0,
      topP: 0.95,
      numCtx: 8096,
    });
    this.main = mainModel;
    this.context = contextModel;
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

    const template = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make
up an answer. There is no need to tell how you find the answer or steps, just tell the answer itself.

{context}


Question: {question}

Helpful Answer:`;

    const prompt = PromptTemplate.fromTemplate(template);

    const chain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(this.main, {
        prompt,
      }),
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

    const chain = loadSummarizationChain(this.context, {
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
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 256,
    });
    try {
      const docs = await splitter.createDocuments([pageContent]);
      return docs;
    } catch (error) {
      logger.error(`Error while splitting documents: ${error}`);
    }
  }
}
