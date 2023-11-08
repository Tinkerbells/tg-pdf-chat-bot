import { type ProviderType } from "./payload";

export type FileType = {
  name: string;
  fileId?: string;
  url?: string;
};

export interface SessionData {
  default: SessionType;
  downloadFilepath: string | null;
  conversation: SessionType;
  provider: ProviderType | null;
}

export type SessionType = {
  sessionId: string | null;
  file: FileType;
  files: FileType[] | null;
  language: string;
};
