import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { languageMenu } from "./languageMenu";
import { getSubscription } from "../utils";
import { Subscription } from "../subscription";

export const settingsMenu = new Menu<BotContext>("settings")
  .submenu("Default language", "language")
  .row();

settingsMenu.dynamic(async (ctx, range) => {
  const subscription = new Subscription();
  const remaining = await subscription.remaining(ctx.from.id.toString());
  range
    .text("Manage subscription", async (ctx) => {
      remaining
        ? await ctx.reply(`You subscribe for ${remaining} days`)
        : await ctx.reply(
            "You are not subscribed!\nUse /subscribe to see all available options",
          );
    })
    .row();
});

settingsMenu.register(languageMenu);
