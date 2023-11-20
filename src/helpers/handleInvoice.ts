import { BotContext } from "..";
import { db } from "../db";
import { SubscriptionPlan } from "@prisma/client";
import type { ProviderType } from "../types/payload";
import { logger } from "../logger";

export const handleInvoice = async (
  provider: ProviderType,
  period: SubscriptionPlan,
  ctx: BotContext,
) => {
  const payload = {
    period: period,
    provider: provider,
  };

  const prices = await getPrices(period);

  try {
    await ctx.replyWithInvoice(
      ctx.t(period).split(" ").slice(0, 3).join(" "),
      ctx.t("payment_description"),
      JSON.stringify(payload),
      provider.token,
      "RUB",
      prices,
    );
  } catch (error) {
    logger.error(`Error while sending invoice: ${error}`);
    throw error;
  }
};

async function getPrices(period: SubscriptionPlan) {
  const { price } = await db.price.findFirst({ where: { plan: period } });
  const prices = [{ label: period.toLowerCase(), amount: price * 100 }];
  return prices;
}
