import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const languageMenu = new Menu<BotContext>("language")
  .text("🇷🇺 Русский", async (ctx) => {
    ctx.session.default.language = "russian";
    await ctx.answerCallbackQuery("Стандартный язык русский");
  })
  .text("🇺🇸 English", async (ctx) => {
    ctx.session.default.language = "english";
    await ctx.answerCallbackQuery("Default language is english");
  });
