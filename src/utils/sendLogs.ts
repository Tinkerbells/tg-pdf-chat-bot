import { BotContext } from "..";
import { env } from "../env";

export const sendLogs = async (ctx: BotContext, text: string) => {
  const id = ctx.from.id;
  const username = ctx.from.username;
  const log = username + " - id:" + id + "\n" + JSON.stringify(text);
  await ctx.api.sendMessage(env.CHAT_LOG_ID, log);
};
