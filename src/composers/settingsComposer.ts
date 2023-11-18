import { Composer } from "grammy";
import { BotContext } from "..";
import { settingsMenu } from "../menus";

export const settingsComposer = new Composer<BotContext>();

settingsComposer.command("settings", async (ctx) => {
  ctx.reply(ctx.t("settings_menu_text"), {
    reply_markup: settingsMenu,
  });
});
