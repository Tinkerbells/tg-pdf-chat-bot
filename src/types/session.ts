import { PDFPage } from "./pdf";

export type FileType = {
  name: string;
  fileId?: string;
  url?: string;
};

export interface SessionData {
  default: SessionType;
  pages: PDFPage[] | null;
  conversation: SessionType;
}

export type SessionType = {
  sessionId: string | null;
  file: FileType;
  files: FileType[] | null;
  language: string;
};
