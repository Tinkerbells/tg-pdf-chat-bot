import { env } from "../env";
import { PDFPage } from "../types/pdf";
import { pinecone } from "../lib/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { getEmbeddings } from "./getEmbeddings";

export const storeDoc = async (pages: PDFPage[]) => {
  try {
    const pineconeIndex = pinecone.Index(env.PINECONE_INDEX);
    const embeddings = await getEmbeddings();
    console.log("Storing vectors...");
    await PineconeStore.fromDocuments(pages, embeddings, {
      pineconeIndex,
    });
    console.log("Vectors are stored");
  } catch (error) {
    console.log("Error while trying to store doc:", Error);
    throw error;
  }
};
