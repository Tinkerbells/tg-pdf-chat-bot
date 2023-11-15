import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { db } from "../db";
import { summarizeDoc } from "../utils";
import { Subscription } from "../subscription";

const fileMenu = new Menu<BotContext>("file");

fileMenu.dynamic(async (ctx, range) => {
  const subscription = new Subscription(ctx.from.id.toString());
  const isSubscribe = await subscription.isSubscribed();

  range.text("Chat", async (ctx) => {
    const id = ctx.session.file.fileId;
    const files = ctx.session.files;
    const { name } = files.find((f) => f.fileId === id);
    ctx.reply(`Entering chat with ${name}:`);
    await ctx.conversation.enter("chat");
  });

  if (!isSubscribe) {
    range.row();
  } else {
    range
      .text("Summarize", async (ctx) => {
        const msg = await ctx.reply("Generation summarization...");
        const text = await summarizeDoc(ctx.session.file.fileId);
        await msg.editText("Answer:\n" + text);
      })
      .row();
  }

  range
    .text("Delete", async (ctx) => {
      const id = ctx.session.file.fileId;
      const files = ctx.session.files;
      const { name } = files.find((f) => f.fileId === id);
      try {
        await db.$transaction([
          db.message.deleteMany({ where: { fileId: id } }),
          db.document.deleteMany({ where: { fileId: id } }),
          db.file.delete({ where: { id: id } }),
        ]);
        ctx.session.files = files.filter((f) => f.fileId !== id);
        console.log(`File ${name} deleted succsesfully`);
        ctx.reply(`File ${name} deleted succsesfully`);
        if (ctx.session.files.length !== 0) {
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
  const files = ctx.session.files;
  files.forEach((file) =>
    range
      .submenu(file.name, "file", async (ctx) => {
        ctx.session.file.fileId = file.fileId;
      })
      .row(),
  );
  return range;
});

filesMenu.register(fileMenu);
