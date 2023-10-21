import { OpenAIEmbeddings } from "langchain/embeddings/openai";

export const getEmbeddings = async () => {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    console.log("Geting embeddings...");
    return embeddings;
  } catch (error) {
    console.log("Error calling openai embeddings:", error);
    throw error;
  }
};
