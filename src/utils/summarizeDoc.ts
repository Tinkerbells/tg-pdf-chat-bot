import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { env } from "../env";
import { db } from "../db";
import { downloadDoc } from "../helpers";
import { parsePdf } from "./parsePdf";
import { PDFPage } from "../types/pdf";
import { getTranslation } from "./getTranslation";
import { detectLanguage } from "./detectLanguage";
import { Document } from "langchain/document";

export const summarizeDoc = async (fileId: string) => {
  const fildDocs = await db.document.findMany({
    where: {
      fileId: fileId,
    },
  });

  const docs = fildDocs.map((doc) => {
    return new Document({ pageContent: doc.content });
  });

  const model = new OpenAI({
    temperature: 0,
    openAIApiKey: env.OPENAI_API_KEY,
  });

  try {
    const chain = loadSummarizationChain(model, {
      type: "map_reduce",
    });
    console.log("Summarizing...");
    try {
      const res = await chain.call({
        input_documents: docs,
      });
      const textPart = fildDocs[0].content.slice(0, 200).replace(/\n/g, "");
      const language = await detectLanguage(textPart);
      const text = await getTranslation(res.text, language);
      return text;
    } catch (error) {
      console.log("Error while summarizing:", error);
      throw error;
    }
  } catch (error) {
    console.log("Error while summarizing docs", error);
    throw error;
  }
};
