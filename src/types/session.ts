import { type ProviderType } from "./payload";

export type FileType = {
  name: string;
  fileId?: string;
  url?: string;
};

export interface SessionData {
  default: SessionType;
  downloadFilepath: string | null;
  provider: ProviderType | null;
}

export type SessionType = {
  file: FileType | null;
  files: FileType[] | null;
  __language_code: string | null;
  downloadFilepath: string | null;
  provider: ProviderType | null;
};

export interface Session {
  id: string;
  value: string;
}

interface Where {
  id: string;
}

interface Create {
  id: string;
  value: string;
}

interface Update {
  value: string;
}

export interface SessionDelegate {
  findUnique: (input: { where: Where }) => Promise<Session | null>;
  upsert: (input: {
    where: Where;
    create: Create;
    update: Update;
  }) => Promise<Session>;
  delete: (input: { where: Where }) => Promise<Session>;
}
