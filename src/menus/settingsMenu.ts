import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { languageMenu } from "./languageMenu";
import { getSubscription } from "../utils";

export const settingsMenu = new Menu<BotContext>("settings")
  .submenu("Default language", "language")
  .row();

settingsMenu.dynamic(async (ctx, range) => {
  const daysLeft = await getSubscription(ctx.from.id.toString());
  range
    .text("Manage subscription", async (ctx) => {
      daysLeft
        ? await ctx.reply(`You subscribe for ${daysLeft} days`)
        : await ctx.reply(
            "You are not subscribed!\nUse /subscribe to see all available options",
          );
    })
    .row();
});
// register all submenus
settingsMenu.register(languageMenu);
