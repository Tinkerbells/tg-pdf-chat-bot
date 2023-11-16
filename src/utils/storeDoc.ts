import { PDFPage } from "../types/pdf";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getEmbeddings } from "./getEmbeddings";
import { Document, Prisma } from "@prisma/client";
import { db } from "../db";

export const prepareDocument = async (page: PDFPage) => {
  let { pageContent } = page;
  pageContent = pageContent.replace(/\n/g, "");
  // split the docs
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 256 });
  try {
    const docs = await splitter.createDocuments([pageContent]);
    return docs;
  } catch (error) {
    console.log("Error while splitting documents:", error);
  }
};

export const storeDoc = async (pages: PDFPage[], fileId: string) => {
  const embeddings = await getEmbeddings();

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
};
