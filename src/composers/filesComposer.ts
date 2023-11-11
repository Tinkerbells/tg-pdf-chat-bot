import { Composer } from "grammy";
import { BotContext } from "..";
import { db } from "../db";
import { filesMenu } from "../menus";

export const filesComposer = new Composer<BotContext>();

filesComposer.command("files", async (ctx) => {
  const files = await db.file.findMany({
    where: {
      sessionId: ctx.from.id.toString(),
    },
  });

  ctx.session.files = files.map((file) => {
    return {
      name: file.name,
      fileId: file.id,
    };
  });

  if (!!files.length) {
    ctx.reply(`You have ${files.length} pdf documents:`, {
      reply_markup: filesMenu,
    });
  } else {
    ctx.reply("You doesn't have any document yet");
  }
});
