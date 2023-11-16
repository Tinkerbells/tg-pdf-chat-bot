import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const languageMenu = new Menu<BotContext>("language");

languageMenu.dynamic(async (ctx, range) => {
  range
    .text("🇷🇺 Русский", async (ctx) => {
      ctx.session.__language_code = "ru";
      await ctx.i18n.renegotiateLocale();
      await ctx.menu.update();
      await ctx.reply(ctx.t("language_default"));
      await ctx.answerCallbackQuery(ctx.t("language_default"));
    })
    .text("🇺🇸 English", async (ctx) => {
      ctx.session.__language_code = "en";
      await ctx.i18n.renegotiateLocale();
      await ctx.menu.update();
      await ctx.reply(ctx.t("language_default"));
      await ctx.answerCallbackQuery(ctx.t("language_default"));
    })
    .row()
    .back(ctx.t("back"), async (ctx) => {
      await ctx.editMessageText(ctx.t("settings_menu_text"));
    })
    .row();
});
