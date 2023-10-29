import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const startMenu = new Menu<BotContext>("start")
  .text("🇷🇺 Русский", async (ctx) => {
    ctx.session.default.language = "russian";
    await ctx.answerCallbackQuery("Стандартный язык русский");
  })
  .text("🇺🇸 English", async (ctx) => {
    ctx.session.default.language = "english";
    await ctx.answerCallbackQuery("Default language is english");
  });
