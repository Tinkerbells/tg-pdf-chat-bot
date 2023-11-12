import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { type PDFPage } from "../types/pdf";
import { unlinkFile } from "../helpers";
import { getEmbeddings } from "./getEmbeddings";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { Prisma, Document } from "@prisma/client";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { db } from "../db";

export class PdfHandler {
  private path: string;
  private page: PDFPage;

  async parsePdf() {
    const loader = new PDFLoader(this.path);
    try {
      const pages = (await loader.load()) as PDFPage[];
      await unlinkFile(this.path);
      return pages;
    } catch (error) {
      console.log(`Error while parsing document ${this.path}:`, error);
      throw error;
    }
  }

  async storeDoc(pages: PDFPage[], fileId: string) {
    try {
      const prepareDocument = async (page: PDFPage) => {
        let { pageContent } = page;
        pageContent = pageContent.replace(/\n/g, "");
        // split the docs
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 256 });
        const docs = await splitter.createDocuments([pageContent]);
        return docs;
      };

      const embeddings = await getEmbeddings();
      console.log("Storing vectors...");

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

      const documents = await Promise.all(pages.map(prepareDocument));

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
      console.log("Vectors are stored!");
      return;
    } catch (error) {
      console.log("Error while trying to store doc:", Error);
      throw error;
    }
  }
}
