import { OpenAI } from "langchain/llms/openai";
import { loadSummarizationChain } from "langchain/chains";
import { env } from "../env";
import { db } from "../db";
import { downloadDoc, unlinkFile } from "../helpers";
import { parsePdf } from "./parsePdf";
import { PDFPage } from "../types/pdf";

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
      // combinePrompt: prompt,
    });

    const res = await chain.call({
      input_documents: docs,
    });

    return res.text;
  } catch (error) {
    console.log("Error while summarizing docs", error);
  }
};
