import { Composer } from "grammy";
import { BotContext } from "..";
import { providersMenu } from "../menus";
import { PayloadType } from "../types/payload";
import { Subscription } from "../subscription";

export const paymentComposer = new Composer<BotContext>();

paymentComposer.command("subscribe", async (ctx) => {
  ctx.reply(ctx.t("providers_menu_text"), {
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
  ctx.session.provider = null;
  await ctx.reply(
    ctx.t("subscription_success") +
      " " +
      ctx.t(payload.period).split(" ").slice(0, 2).join(" "),
  );
});
