import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { getInvoice } from "../helpers";

export const subscriptionMenu = new Menu<BotContext>("subscription");

subscriptionMenu.dynamic((ctx, range) => {
  if (ctx.session.default.isPro) {
    ctx.reply("You are subscription till...");
  } else {
    range
      .text("Subscribe for 1 month", async (ctx) => {
        await getInvoice(ctx.from.id, "ONE_MONTH", ctx);
      })
      .row();
    range
      .text("Subscribe for 3 month", async (ctx) => {
        await getInvoice(ctx.from.id, "THREE_MONTH", ctx);
      })
      .row();
    range
      .text("Subscribe for 6 month", async (ctx) => {
        await getInvoice(ctx.from.id, "SIX_MONTH", ctx);
      })
      .row();
    range
      .text("Subscribe for an year", async (ctx) => {
        await getInvoice(ctx.from.id, "ONE_YEAR", ctx);
      })
      .row();
  }
});
