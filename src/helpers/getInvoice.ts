import { BotContext } from "..";
import { db } from "../db";
import { env } from "../env";
import { SubscriptionPlan } from "@prisma/client";
export const getInvoice = async (
  id: number,
  period: SubscriptionPlan,
  ctx: BotContext,
) => {
  const title = `${period.toLowerCase()}`;
  const description = `Desc: ${period.toLowerCase()}`;

  const payload = {
    unique_id: `${id}_${Number(new Date())}`,
    provider_token: env.PROVIDER_TOKEN,
  };

  const prices = await getPrice(period);

  await ctx.replyWithInvoice(
    title,
    description,
    JSON.stringify(payload),
    env.PROVIDER_TOKEN,
    "RUB",
    prices,
  );
};

async function getPrice(period: SubscriptionPlan) {
  const { price } = await db.price.findFirst({ where: { plan: period } });
  const prices = [{ label: period.toLowerCase(), amount: price * 100 }];
  return prices;
}
