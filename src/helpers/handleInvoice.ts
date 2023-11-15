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

  const prices = await getPrices(period);

  console.log(ctx.t("payment_description").toString());
  try {
    await ctx.replyWithInvoice(
      ctx.t(period),
      ctx.t("payment_description").toString(),
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

async function getPrices(period: SubscriptionPlan) {
  const { price } = await db.price.findFirst({ where: { plan: period } });
  const prices = [{ label: period.toLowerCase(), amount: price * 100 }];
  return prices;
}
