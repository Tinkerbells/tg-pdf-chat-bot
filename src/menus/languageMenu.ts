import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const languageMenu = new Menu<BotContext>("language")
  .text("🇷🇺 Русский", async (ctx) => {
    ctx.session.__language_code = "ru";
    await ctx.i18n.renegotiateLocale();
    await ctx.answerCallbackQuery("Стандартный язык русский");
  })
  .text("🇺🇸 English", async (ctx) => {
    ctx.session.__language_code = "en";
    await ctx.i18n.renegotiateLocale();
    await ctx.answerCallbackQuery("Default language is english");
  })
  .row()
  .back("Go back")
  .row();
