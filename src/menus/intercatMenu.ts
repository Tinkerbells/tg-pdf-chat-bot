import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { getTranslation, storeDoc, summarizeDoc } from "../utils";

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
      if (ctx.session.default.language === "ENGLISH") {
        ctx.api.editMessageText(
          msg.chat.id,
          msg.message_id,
          "Answer:\n" + text,
        );
      } else {
        const translation = await getTranslation(
          text,
          ctx.session.default.language,
        );
        ctx.api.editMessageText(
          msg.chat.id,
          msg.message_id,
          "Answer:\n" + translation,
        );
      }
      ctx.session.pages = [];
    })
    .row();
});
