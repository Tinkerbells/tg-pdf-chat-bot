import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  BOT_TOKEN: z.string(),
  PROVIDER_TOKEN: z.string(),
  SHOP_ID: z.string(),
  SHOP_ARTICLE_ID: z.string(),
  PINECONE_API_KEY: z.string(),
  PINECONE_INDEX: z.string(),
  OPENAI_API_KEY: z.string(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  process.exit(1);
}

export const env = parsed.data;
