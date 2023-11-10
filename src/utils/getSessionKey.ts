import { BotContext } from "..";

export const getSessionKey = (ctx: BotContext) => {
  return ctx.from?.id.toString();
};
