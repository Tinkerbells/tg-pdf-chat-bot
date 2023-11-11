import { Composer } from "grammy";
import { BotContext } from "..";
import { providersMenu } from "../menus";
import { PayloadType } from "../types/payload";
import { getEndDate, getPriceId } from "../helpers";
import { db } from "../db";

export const paymentComposer = new Composer<BotContext>();

paymentComposer.command("subscribe", async (ctx) => {
  ctx.reply("You can subscribe using these methods:", {
    reply_markup: providersMenu,
  });
});

paymentComposer.on("pre_checkout_query", (ctx) => {
  ctx.answerPreCheckoutQuery(true);
});

paymentComposer.on(":successful_payment", async (ctx) => {
  const payload = JSON.parse(
    ctx.message.successful_payment.invoice_payload,
  ) as PayloadType;
  const priceID = getPriceId(payload.period);
  const endedAt = getEndDate(payload.period);
  await db.subscription.create({
    data: {
      sessionId: ctx.from.id.toString(),
      priceId: priceID,
      endedAt: endedAt,
    },
  });
  await ctx.reply(`You successfuly subscribed for ${payload.period}`);
});
