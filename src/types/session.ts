import { PDFPage } from "./pdf";

export type FileType = {
  name: string;
  fileId: string;
};

export interface SessionData {
  default: SessionType;
  pages: PDFPage[] | null;
  conversation: SessionType;
}

export type SessionType = {
  fileId: string | null;
  sessionId: string | null;
  files: FileType[] | null;
  language: string;
};
