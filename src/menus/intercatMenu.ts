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
  const sessionId = ctx.from.id.toString();
  const daysLeft = await getSubscription(sessionId);
  range.text("Chat", async (ctx) => {
    const pages = await parsePdf(ctx.session.downloadFilepath);
    const id = await saveFile(ctx.session.file, sessionId);
    await storeDoc(pages, id);
    console.log("Enterinig conversation with file");
    ctx.reply("Entering chat");
    ctx.session.file.fileId = id;
    await ctx.conversation.enter("chat");
  });

  !daysLeft && range.row();

  if (daysLeft) {
    range
      .text("Summarize", async (ctx) => {
        const pages = await parsePdf(ctx.session.downloadFilepath);
        const id = await saveFile(ctx.session.file, sessionId);
        await storeDoc(pages, id);
        const msg = await ctx.reply("Summarizing...");
        const text = await summarizeDoc(id);
        await msg.editText("Answer:\n" + text);
      })
      .row();
  }
  range
    .text("Save", async (ctx) => {
      const pages = await parsePdf(ctx.session.downloadFilepath);
      const id = await saveFile(ctx.session.file, sessionId);
      await storeDoc(pages, id);
      ctx.session.file.fileId = id;
      await ctx.reply(`File ${ctx.session.file.name} is saved`);
      return;
    })
    .row();
  range.url("Open in browser", ctx.session.file.url).row();
});
