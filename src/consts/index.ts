import { env } from "../env";

export const INIT_SESSION = {
  sessionId: null,
  file: null,
  files: null,
  language: null,
};

export const PROVIDERS = [
  { name: "sberbank", token: env.SBER_PROVIDER_TOKEN },
  { name: "yookassa", token: env.YOOKASSA_PROVIDER_TOKEN },
];
