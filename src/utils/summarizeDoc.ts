import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { env } from "../env";
import { db } from "../db";
import { downloadDoc } from "../helpers";
import { parsePdf } from "./parsePdf";
import { PDFPage } from "../types/pdf";
import { getTranslation } from "./getTranslation";
import { detectLanguage } from "./detectLanguage";

export const summarizeDoc = async (fileId: string, docs?: PDFPage[]) => {
  if (!docs) {
    const file = await db.file.findFirst({
      where: { id: fileId },
    });

    const dlPath = await downloadDoc(file.url, file.id);

    docs = await parsePdf(dlPath);
  }

  const model = new OpenAI({
    temperature: 0,
    openAIApiKey: env.OPENAI_API_KEY,
  });

  try {
    const chain = loadSummarizationChain(model, {
      type: "map_reduce",
    });

    const res = await chain.call({
      input_documents: docs,
    });

    const textPart = docs[0].pageContent.slice(0, 200).replace(/\n/g, "");
    const language = await detectLanguage(textPart);
    const text = await getTranslation(res.text, language);
    return text;
  } catch (error) {
    console.log("Error while summarizing docs", error);
    throw error;
  }
};
