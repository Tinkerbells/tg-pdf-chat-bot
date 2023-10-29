import { PDFPage } from "../types/pdf";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getEmbeddings } from "./getEmbeddings";
import { Document, Prisma } from "@prisma/client";
import { db } from "../db";

export const storeDoc = async (pages: PDFPage[], fileId: string) => {
  try {
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
  } catch (error) {
    console.log("Error while trying to store doc:", Error);
    throw error;
  }
};

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

const prepareDocument = async (page: PDFPage) => {
  let { pageContent } = page;
  pageContent = pageContent.replace(/\n/g, "");
  // split the docs
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 256 });
  const docs = await splitter.createDocuments([pageContent]);
  return docs;
};
