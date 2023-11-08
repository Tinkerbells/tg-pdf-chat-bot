import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import {
  getSubscription,
  parsePdf,
  saveFile,
  storeDoc,
  summarizeDoc,
} from "../utils";

export const interactMenu = new Menu<BotContext>("interact");

interactMenu.dynamic(async (ctx, range) => {
  const daysLeft = await getSubscription(ctx.session.default.sessionId);
  range.text("Chat", async (ctx) => {
    const pages = await parsePdf(ctx.session.downloadFilepath);
    const id = await saveFile(
      ctx.session.default.file,
      ctx.session.default.sessionId,
    );
    await storeDoc(pages, id);
    console.log("Enterinig conversation with file");
    ctx.reply("Entering chat");
    ctx.session.default.file.fileId = id;
    await ctx.conversation.enter("chat");
  });

  !daysLeft && range.row();

  if (daysLeft) {
    range
      .text("Summarize", async (ctx) => {
        const pages = await parsePdf(ctx.session.downloadFilepath);
        const id = await saveFile(
          ctx.session.default.file,
          ctx.session.default.sessionId,
        );
        await storeDoc(pages, id);
        const msg = await ctx.reply("Summarizing...");
        const text = await summarizeDoc(id);
        ctx.api.editMessageText(
          msg.chat.id,
          msg.message_id,
          "Answer:\n" + text,
        );
      })
      .row();
  }
  range
    .text("Save", async (ctx) => {
      const pages = await parsePdf(ctx.session.downloadFilepath);
      const id = await saveFile(
        ctx.session.default.file,
        ctx.session.default.sessionId,
      );
      await storeDoc(pages, id);
      ctx.session.default.file.fileId = id;
      await ctx.reply(`File ${ctx.session.default.file.name} is saved`);
      return;
    })
    .row();
});
