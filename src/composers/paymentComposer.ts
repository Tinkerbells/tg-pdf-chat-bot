import { Composer } from "grammy";
import { BotContext } from "..";
import { providersMenu } from "../menus";
import { PayloadType } from "../types/payload";
import { Subscription } from "../subscription";
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
  const sessionId = ctx.from.id.toString();
  const payload = JSON.parse(
    ctx.message.successful_payment.invoice_payload,
  ) as PayloadType;
  const subscription = new Subscription(sessionId);
  await subscription.create(payload.period);
  ctx.session.filesUploadTimeout = null;
  await ctx.reply(`You successfuly subscribed for ${payload.period}`);
});
