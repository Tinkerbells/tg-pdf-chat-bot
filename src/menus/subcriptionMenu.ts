import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { handleInvoice } from "../helpers";

export const subscriptionMenu = new Menu<BotContext>("subscription");

subscriptionMenu.dynamic(async (ctx, range) => {
  const provider = ctx.session.provider;
  range
    .text("Subscribe for 1 month", async (ctx) => {
      await handleInvoice(provider, "ONE_MONTH", ctx);
    })
    .row();
  range
    .text("Subscribe for 3 month", async (ctx) => {
      await handleInvoice(provider, "THREE_MONTH", ctx);
    })
    .row();
  range
    .text("Subscribe for one year", async (ctx) => {
      await handleInvoice(provider, "ONE_YEAR", ctx);
    })
    .row()
    .back("Go back");
});
