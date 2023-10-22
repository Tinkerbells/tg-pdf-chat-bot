import { getEmbeddings } from "./getEmbeddings";
import { Document, Prisma } from "@prisma/client";
import { PrismaVectorStore } from "langchain/vectorstores/prisma";
import { db } from "../db";

export const getMatches = async (message: string, fileId: string) => {
  try {
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
        filter: {
          namespace: {
            equals: fileId,
          },
        },
      },
    );
    console.log("Geting matches...");
    const results = await vectorStore.similaritySearch(message, 3);
    console.log("Got matches!");
    return results;
  } catch (error) {
    console.log("Error querying embeddings:", error);
    throw error;
  }
};
