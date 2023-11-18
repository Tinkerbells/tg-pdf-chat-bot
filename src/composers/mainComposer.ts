import { Composer } from "grammy";
import { BotContext } from "..";
import { logger } from "../logger";
import { startMenu } from "../menus";

export const mainComposer = new Composer<BotContext>();

mainComposer.command("start", async (ctx) => {
  await ctx.reply(ctx.t("start"), { reply_markup: startMenu });
  logger.info(`New user: ${ctx.from.username} - ${ctx.from.id}`);
});

mainComposer.command("help", async (ctx) => {
  await ctx.reply(ctx.t("help"), { parse_mode: "HTML" });
});

mainComposer.command("about", async (ctx) => {
  await ctx.reply(ctx.t("about"), { parse_mode: "HTML" });
});
