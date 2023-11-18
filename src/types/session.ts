import { type ProviderType } from "./payload";

export type FileType = {
  name: string;
  fileId?: string;
  url?: string;
};

export type SessionType = {
  file?: FileType;
  files?: FileType[];
  downloadFilepath?: string;
  provider?: ProviderType;
  __language_code?: string;
  filesCount?: number;
  filesUploadTimeout?: Date | null;
  showAdvice: boolean;
};

// Prisma adapter types
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
