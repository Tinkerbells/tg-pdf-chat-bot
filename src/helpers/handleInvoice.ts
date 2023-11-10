import { BotContext } from "..";
import { db } from "../db";
import { SubscriptionPlan } from "@prisma/client";
import { type ProviderType } from "../types/payload";

export const handleInvoice = async (
  provider: ProviderType,
  period: SubscriptionPlan,
  ctx: BotContext,
) => {
  const title = `${period.toLowerCase()}`;
  const description = `Desc: ${period.toLowerCase()}`;

  const payload = {
    period: period,
    provider: provider,
  };

  const prices = await getPrice(period);

  try {
    await ctx.replyWithInvoice(
      title,
      description,
      JSON.stringify(payload),
      provider.token,
      "RUB",
      prices,
    );
  } catch (error) {
    console.log("Error while sending invoice:", error);
    throw error;
  }
};

async function getPrice(period: SubscriptionPlan) {
  const { price } = await db.price.findFirst({ where: { plan: period } });
  const prices = [{ label: period.toLowerCase(), amount: price * 100 }];
  return prices;
}
