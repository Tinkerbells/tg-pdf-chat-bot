import { env } from "../env";
import { SessionType } from "../prismaAdapter";

export const INIT_SESSION: SessionType = {
  filesCount: 0,
};

export const MAX_FILE_LIMIT_PRO = 25;
export const MAX_FILE_LIMIT_FREE = 4;

export const MAX_PAGES_LIMIT_PRO = 40;
export const MAX_PAGES_LIMIT_FREE = 2;

export const PROVIDERS = [
  { name: "sberbank", token: env.SBER_PROVIDER_TOKEN },
  { name: "yookassa", token: env.YOOKASSA_PROVIDER_TOKEN },
];
