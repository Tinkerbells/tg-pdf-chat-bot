import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { handleInvoice } from "../helpers";
import { SubscriptionPlan } from "@prisma/client";

export const subscriptionMenu = new Menu<BotContext>("subscription");

const options: SubscriptionPlan[] = [
  SubscriptionPlan.ONE_MONTH,
  SubscriptionPlan.THREE_MONTH,
  SubscriptionPlan.ONE_YEAR,
];

subscriptionMenu.dynamic(async (ctx, range) => {
  const provider = ctx.session.provider;
  options.forEach((opt) =>
    range
      .text(ctx.t(opt), async () => {
        await handleInvoice(provider, opt, ctx);
      })
      .row(),
  );
  range.back(ctx.t("back"), async (ctx) => {
    await ctx.editMessageText(ctx.t("providers_menu_text"));
  });
});
