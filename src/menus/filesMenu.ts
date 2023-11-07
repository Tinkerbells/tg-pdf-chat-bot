import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { db } from "../db";
import { getSubscription, summarizeDoc } from "../utils";

const fileMenu = new Menu<BotContext>("file");

fileMenu.dynamic(async (ctx, range) => {
  const daysLeft = await getSubscription(ctx.session.default.sessionId);
  range.text("Chat", async (ctx) => {
    const id = ctx.session.default.file.fileId;
    const files = ctx.session.default.files;
    const { name } = files.find((f) => f.fileId === id);
    ctx.reply(`Entering chat with ${name}:`);
    ctx.session.conversation = ctx.session.default;
    await ctx.conversation.enter("chat");
  });

  !daysLeft && range.row();

  if (daysLeft) {
    range
      .text("Summarize", async (ctx) => {
        const msg = await ctx.reply("Generation summarization...");
        const text = await summarizeDoc(ctx.session.default.file.fileId);
        ctx.api.editMessageText(
          msg.chat.id,
          msg.message_id,
          "Answer:\n" + text,
        );
      })
      .row();
  }
  range
    .text("Delete", async (ctx) => {
      const id = ctx.session.default.file.fileId;
      const files = ctx.session.default.files;
      const { name } = files.find((f) => f.fileId === id);
      try {
        await db.$transaction([
          db.message.deleteMany({ where: { fileId: id } }),
          db.document.deleteMany({ where: { fileId: id } }),
          db.file.delete({ where: { id: id } }),
        ]);
        ctx.session.default.files = files.filter((f) => f.fileId !== id);
        console.log(`File ${name} deleted succsesfully`);
        ctx.reply(`File ${name} deleted succsesfully`);
        if (ctx.session.default.files.length !== 0) {
          ctx.menu.back();
        }
      } catch (error) {
        console.log("Error while deleting file", error);
        throw error;
      }
    })
    .row()
    .back("Go Back");
});

export const filesMenu = new Menu<BotContext>("files");

filesMenu.dynamic((ctx, range) => {
  const files = ctx.session.default.files;
  files.forEach((file) =>
    range
      .submenu(file.name, "file", async (ctx) => {
        ctx.session.default.file.fileId = file.fileId;
      })
      .row(),
  );
  return range;
});

filesMenu.register(fileMenu);
