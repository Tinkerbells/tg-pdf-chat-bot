import { NextFunction } from "grammy";
import { BotContext } from "..";
import { logger } from "../logger";

export async function ignoreOld(
  ctx: BotContext,
  next: NextFunction, // is an alias for: () => Promise<void>
): Promise<void> {
  const threshold = 5 * 60;
  if (ctx.msg?.date && new Date().getTime() / 1000 - ctx.msg.date > threshold) {
    logger.info(
      `Ignoring message from user: id - ${ctx.from.id}, username: ${ctx.from
        ?.username} at chat ${ctx.chat?.id} (${new Date()}:${ctx.msg.date})`,
    );
    await ctx.reply(ctx.t("tooold_message"));
    return;
  }
  return next();
}
