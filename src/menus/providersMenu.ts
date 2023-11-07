import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { PROVIDERS } from "../consts";
import { subscriptionMenu } from "./subcriptionMenu";

export const providersMenu = new Menu<BotContext>("providers");

providersMenu.dynamic((ctx, range) => {
  PROVIDERS.map((provider) => {
    range
      .submenu(provider.name, "subscription", async (ctx) => {
        ctx.session.provider = provider;
      })
      .row();
  });
});

providersMenu.register(subscriptionMenu);
