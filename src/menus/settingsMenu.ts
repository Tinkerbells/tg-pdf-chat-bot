import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { languageMenu } from "./languageMenu";
import { Subscription } from "../subscription";

export const settingsMenu = new Menu<BotContext>("settings")
  .submenu("Default language", "language")
  .row();

settingsMenu.dynamic(async (ctx, range) => {
  const subscription = new Subscription(ctx.from.id.toString());
  const remaining = await subscription.remaining();
  range
    .text(ctx.t("subscription_manage"), async (ctx) => {
      remaining
        ? await ctx.reply(
            ctx.t("subscription_remaining", { remaining: remaining }),
          )
        : await ctx.reply(ctx.t("subscription_warning"));
    })
    .row();
});

settingsMenu.register(languageMenu);
