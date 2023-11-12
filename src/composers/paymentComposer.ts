import { Composer } from "grammy";
import { BotContext } from "..";
import { providersMenu } from "../menus";
import { PayloadType } from "../types/payload";
import { getEndDate, getPriceId } from "../helpers";
import { db } from "../db";
import { Subscription } from "../subscription";

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
  const subscription = new Subscription(payload.period);
  await subscription.create(ctx.from.id.toString());
  ctx.session.filesUploadTimeout = null;
  await ctx.reply(`You successfuly subscribed for ${payload.period}`);
});
