import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  BOT_TOKEN: z.string(),
  OPENAI_API_KEY: z.string(),
  HUGGINFACE_API_KEY: z.string(),
  REDIS_PASSWORD: z.string(),
  API_URL: z.string(),

  // providers for payments
  YOOKASSA_PROVIDER_TOKEN: z.string(),
  SBER_PROVIDER_TOKEN: z.string(),
  CHAT_LOG_ID: z.string(),
  WALLET_API_KEY: z.string(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  process.exit(1);
}

export const env = parsed.data;
