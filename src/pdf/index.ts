import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import type { PDFPage } from "../types/pdf";
import { unlinkFile } from "../helpers";
import { logger } from "../logger";
import type { FileType } from "../prismaAdapter";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document, Prisma } from "@prisma/client";
import { db } from "../db";

export class PdfHandler {
  private filePath: string;
  constructor(filePath?: string) {
    this.filePath = filePath;
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
      logger.error(`Error while saving file: ${error}`);
    }
  }

  async store(pages: PDFPage[], fileId: string) {
    const embeddings = this.getEmbeddings();

    const vectorStore = PrismaVectorStore.withModel<Document>(db).create(
      embeddings,
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
    } catch (error) {
      console.log("Error while trying to store doc:", Error);
      throw error;
    }
  }

  async matches(message: string, fileId: string) {
    try {
      const embeddings = this.getEmbeddings();

      const vectorStore = PrismaVectorStore.withModel<Document>(db).create(
        embeddings,
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
      console.log("Error while gettings matches:", error);
      throw error;
    }
  }

  private getEmbeddings() {
    try {
      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      });
      return embeddings;
    } catch (error) {
      logger.error(`Error calling openai embeddings: ${error}`);
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
      console.log(`Error while splitting documents: ${error}`);
    }
  }
}
