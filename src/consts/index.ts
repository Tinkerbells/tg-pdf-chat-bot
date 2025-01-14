import { env } from "../env";
import { SessionType } from "../prismaAdapter";

export const MAX_FILE_LIMIT_FREE = 5;
export const MAX_PAGES_LIMIT_FREE = 20;

export const INIT_SESSION: SessionType = {
  filesCount: 0,
  showAdvice: true,
  currentFilesPage: 1,
};

export const PROVIDERS = [
  { name: "yookassa", token: env.YOOKASSA_PROVIDER_TOKEN },
];
