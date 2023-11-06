import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { PROVIDERS } from "../consts";
import { subscriptionMenu } from "./subcriptionMenu";
import { getSubscription } from "../utils";

export const providersMenu = new Menu<BotContext>("providers");

providersMenu.dynamic(async (ctx, range) => {
  const daysLeft = await getSubscription(ctx.session.default.sessionId);
  if (daysLeft) {
    ctx.reply(`You are subscribed for ${daysLeft} days`);
  } else {
    PROVIDERS.map((provider) => {
      range
        .submenu(provider.name, "subscription", async (ctx) => {
          ctx.session.provider = provider;
        })
        .row();
    });
    range.back("Go back").row();
  }
});

providersMenu.register(subscriptionMenu);
