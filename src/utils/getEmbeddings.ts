import { OpenAIEmbeddings } from "langchain/embeddings/openai";

export const getEmbeddings = async () => {
  try {
    console.log("Geting embeddings...");
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    console.log("Got embeddings!");
    return embeddings;
  } catch (error) {
    console.log("Error calling openai embeddings:", error);
    throw error;
  }
};
