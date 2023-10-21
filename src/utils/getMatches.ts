import { env } from "../env";
import { pinecone } from "../lib/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { getEmbeddings } from "./getEmbeddings";

export const getMatches = async (message: string) => {
  try {
    const embeddings = await getEmbeddings();
    const pineconeIndex = pinecone.Index(env.PINECONE_INDEX);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });
    console.log("Geting matches...");
    const results = await vectorStore.similaritySearch(message, 4);
    console.log("Got matches");
    return results;
  } catch (error) {
    console.log("Error querying embeddings:", error);
    throw error;
  }
};
