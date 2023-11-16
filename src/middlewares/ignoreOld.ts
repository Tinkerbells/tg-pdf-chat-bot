import { NextFunction } from "grammy";
import { BotContext } from "..";

export async function ignoreOld(
  ctx: BotContext,
  next: NextFunction, // is an alias for: () => Promise<void>
): Promise<void> {
  const threshold = 5 * 60;
  if (ctx.msg?.date && new Date().getTime() / 1000 - ctx.msg.date > threshold) {
    console.log(
      `Ignoring message from user ${ctx.from?.id} at chat ${ctx.chat?.id} (${
        new Date().getTime() / 1000
      }:${ctx.msg.date})`,
    );
    return;
  }
  return next();
}
