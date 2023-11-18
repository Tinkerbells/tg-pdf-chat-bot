import { Composer } from "grammy";
import { BotContext } from "..";
import { db } from "../db";

export const leaveComposer = new Composer<BotContext>();

leaveComposer.command("leave", async (ctx) => {
  await ctx.conversation.exit();
  await db.message.deleteMany({
    where: {
      fileId: ctx.session.file.fileId,
    },
  });
  await ctx.reply(ctx.t("leave_mesasge"));
});

leaveComposer.callbackQuery("leave", async (ctx) => {
  await ctx.conversation.exit("chat");
  await db.message.deleteMany({
    where: {
      fileId: ctx.session.file.fileId,
    },
  });
  await ctx.reply(ctx.t("leave_mesasge"));
  await ctx.answerCallbackQuery("leave_chat");
});
