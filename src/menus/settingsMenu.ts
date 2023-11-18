import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { languageMenu } from "./languageMenu";
import { Subscription } from "../subscription";

export const settingsMenu = new Menu<BotContext>("settings");

settingsMenu.dynamic(async (ctx, range) => {
  const subscription = new Subscription(ctx.from.id.toString());
  const remaining = await subscription.remaining();

  range
    .submenu(ctx.t("language_menu_text"), "language", async (ctx) => {
      await ctx.editMessageText(ctx.t("language_menu_text"));
    })
    .row();
  range
    .text(ctx.t("subscription_manage"), async (ctx) => {
      remaining
        ? await ctx.reply(
            ctx.t("subscription_remaining", { remaining: remaining }),
            { parse_mode: "HTML" },
          )
        : await ctx.reply(ctx.t("subscription_warning"));
    })
    .row();
});
