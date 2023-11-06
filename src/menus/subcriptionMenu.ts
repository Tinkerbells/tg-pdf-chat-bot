import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { getDateDifference, handleInvoice } from "../helpers";
import { db } from "../db";
import { getSubscription } from "../utils";

export const subscriptionMenu = new Menu<BotContext>("subscription");

subscriptionMenu.dynamic(async (ctx, range) => {
  const daysLeft = await getSubscription(ctx.session.default.sessionId);
  if (daysLeft) {
    ctx.reply(`You are subscribed for ${daysLeft} days`);
  } else {
    range
      .text("Subscribe for 1 month", async (ctx) => {
        await handleInvoice("ONE_MONTH", ctx);
      })
      .row();
    range
      .text("Subscribe for 3 month", async (ctx) => {
        await handleInvoice("THREE_MONTH", ctx);
      })
      .row();
    range
      .text("Subscribe for one year", async (ctx) => {
        await handleInvoice("ONE_YEAR", ctx);
      })
      .row();
  }
});
