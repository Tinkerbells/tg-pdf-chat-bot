import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { storeDoc, summarizeDoc } from "../utils";

export const interactMenu = new Menu<BotContext>("interact");

interactMenu.dynamic((ctx, range) => {
  const pages = ctx.session.pages;
  const fileId = ctx.session.default.fileId;

  range
    .text("Chat", async (ctx) => {
      await storeDoc(pages, fileId);
      console.log("Enterinig conversation with file");
      ctx.reply("Entering chat");
      ctx.session.pages = [];
      await ctx.conversation.enter("chat");
    })
    .text("Summarize", async (ctx) => {
      const msg = await ctx.reply("Summarizing...");
      const text = await summarizeDoc(fileId, pages);
      ctx.api.editMessageText(msg.chat.id, msg.message_id, "Answer:\n" + text);
      ctx.session.pages = [];
    })
    .row();
});
