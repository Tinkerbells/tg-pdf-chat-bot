import { Composer } from "grammy";
import { BotContext } from "..";
import { db } from "../db";
import { filesMenu } from "../menus";

export const filesComposer = new Composer<BotContext>();

filesComposer.command("files", async (ctx) => {
  ctx.session.hideBack = false;
  ctx.session.currentFilesPage = 1;
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
    ctx.reply(ctx.t("files_menu_text", { count: files.length }), {
      reply_markup: filesMenu,
      parse_mode: "HTML",
    });
  } else {
    ctx.reply(ctx.t("files_not_found"));
  }
});
