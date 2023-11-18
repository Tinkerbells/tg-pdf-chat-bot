import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { db } from "../db";

export const leaveMenu = new Menu<BotContext>("leave");

leaveMenu.dynamic(async (ctx, range) => {
  range.text(ctx.t("chat_leave"), async (ctx) => {
    await ctx.conversation.exit();
    await db.message.deleteMany({
      where: {
        fileId: ctx.session.file.fileId,
      },
    });
    await ctx.reply(ctx.t("leave_mesasge"));
  });
});
