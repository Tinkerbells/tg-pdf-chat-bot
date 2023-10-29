import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { db } from "../db";
import { getTranslation, summarizeDoc } from "../utils";

const fileMenu = new Menu<BotContext>("file")
  .text("Chat", async (ctx) => {
    const file = ctx.session.default.files.find(
      (file) => file.fileId === ctx.session.default.fileId,
    );

    ctx.reply("Chat with file - " + file.name + " " + "is ready");

    await ctx.conversation.enter("chat");
  })
  .text("Delete", async (ctx) => {
    const id = ctx.session.default.fileId;
    try {
      await db.$transaction([
        db.message.deleteMany({ where: { fileId: id } }),
        db.document.deleteMany({ where: { fileId: id } }),
        db.file.delete({ where: { id: ctx.session.default.fileId } }),
      ]);
      console.log("File deleted succsesfully");
      ctx.reply("File deleted succsesfully");
      if (ctx.session.default.files.length-- !== 0) {
        ctx.menu.back();
      }
      return;
    } catch (error) {
      console.log("Error while deleting file", error);
    }
  })
  .row()
  .text("Summarize", async (ctx) => {
    const msg = ctx.reply("Generation summarization...");
    const text = await summarizeDoc(ctx.session.default.fileId);
    if (ctx.session.default.language === "US") {
      ctx.reply(text);
    } else {
      const translation = await getTranslation(
        text,
        ctx.session.default.language,
      );
      ctx.reply(translation);
    }
  })
  .back("Go Back");

export const filesMenu = new Menu<BotContext>("files");

filesMenu.dynamic((ctx, range) => {
  const files = ctx.session.default.files;
  files.forEach((file) =>
    range
      .submenu(file.name, "file", async (ctx) => {
        ctx.session.default.fileId = file.fileId;
      })
      .row(),
  );
  return range;
});

filesMenu.register(fileMenu);
