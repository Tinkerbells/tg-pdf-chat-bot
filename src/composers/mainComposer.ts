import { Composer } from "grammy";
import { BotContext } from "..";
import { logger } from "../logger";
import { languageMenu } from "../menus";

export const mainComposer = new Composer<BotContext>();

mainComposer.command("start", async (ctx) => {
  ctx.session.hideBack = true;
  await ctx.reply(ctx.t("start"), {
    parse_mode: "HTML",
    reply_markup: languageMenu,
  });
  logger.info(`New user: ${ctx.from.username} - ${ctx.from.id}`);
});

mainComposer.command("help", async (ctx) => {
  await ctx.reply(ctx.t("help"), { parse_mode: "HTML" });
});

mainComposer.command("about", async (ctx) => {
  await ctx.reply(ctx.t("about"), { parse_mode: "HTML" });
});
