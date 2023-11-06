import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { getDateDifference, handleInvoice } from "../helpers";
import { db } from "../db";

export const subscriptionMenu = new Menu<BotContext>("subscription");

subscriptionMenu.dynamic(async (ctx, range) => {
  const subscriptions = await db.subscription.findMany({
    where: {
      sessionId: ctx.session.default.sessionId,
    },
  });
  const duration = subscriptions.map((sub) =>
    getDateDifference(sub.createdAt, sub.endedAt),
  );

  const daysLeft = duration.reduce((a, b) => a + b, 0);

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
