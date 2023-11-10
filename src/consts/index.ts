import { env } from "../env";

export const INIT_SESSION = {
  file: {},
  files: [],
  __language_code: "ru",
};

export const PROVIDERS = [
  { name: "sberbank", token: env.SBER_PROVIDER_TOKEN },
  { name: "yookassa", token: env.YOOKASSA_PROVIDER_TOKEN },
];
