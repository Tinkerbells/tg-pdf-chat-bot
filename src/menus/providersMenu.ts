import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { PROVIDERS } from "../consts";
import { subscriptionMenu } from "./subcriptionMenu";

export const providersMenu = new Menu<BotContext>("providers");

providersMenu.dynamic((_, range) => {
  PROVIDERS.map((provider) => {
    range
      .submenu("💳" + " " + provider.name, "subscription", async (ctx) => {
        ctx.session.provider = provider;
        await ctx.editMessageText(ctx.t("subscription_menu_text"));
      })
      .row();
  });
});

providersMenu.register(subscriptionMenu);
