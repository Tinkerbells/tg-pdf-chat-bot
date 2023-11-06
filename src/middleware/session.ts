import { NextFunction } from "grammy";
import { BotContext } from "..";
import { db } from "../db";

export const getSession = async (
  ctx: BotContext,
  next: NextFunction,
): Promise<void> => {
  const { id: sessionId } = await db.session.findFirst({
    where: {
      key: ctx.from.id.toString(),
    },
  });
  await next();
  ctx.session.default.sessionId = sessionId;
};
