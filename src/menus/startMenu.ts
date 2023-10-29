import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const startMenu = new Menu<BotContext>("start")
  .text("🇷🇺 Русский", async (ctx) => {
    ctx.session.default.language = "russian";
  })
  .text("🇺🇸 English", async (ctx) => {
    ctx.session.default.language = "english";
  });
