import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { type PDFPage } from "../types/pdf";
import { unlinkFile } from "../helpers";

export const parsePdf = async (path: string) => {
  const loader = new PDFLoader(path);
  try {
    const pages = (await loader.load()) as PDFPage[];
    await unlinkFile(path);
    return pages;
  } catch (error) {
    console.log(`Error while parsing document ${path}:`, error);
    throw error;
  }
};
