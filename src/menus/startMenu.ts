import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const startMenu = new Menu<BotContext>("start");

startMenu.dynamic(async (_, range) => {
  range
    .text("🇷🇺 Русский", async (ctx) => {
      ctx.session.__language_code = "ru";
      await ctx.i18n.renegotiateLocale();
      await ctx.reply(ctx.t("language_default"));
      await ctx.answerCallbackQuery(ctx.t("language_default"));
    })
    .text("🇺🇸 English", async (ctx) => {
      ctx.session.__language_code = "en";
      await ctx.i18n.renegotiateLocale();
      await ctx.reply(ctx.t("language_default"));
      await ctx.answerCallbackQuery(ctx.t("language_default"));
    })
    .row();
});
