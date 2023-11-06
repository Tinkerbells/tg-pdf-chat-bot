import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { getSubscription, saveFile, storeDoc, summarizeDoc } from "../utils";

export const interactMenu = new Menu<BotContext>("interact");

interactMenu.dynamic(async (ctx, range) => {
  const pages = ctx.session.pages;
  const isSubscribed = await getSubscription(ctx.session.default.sessionId);

  range.text("Chat", async (ctx) => {
    const id = await saveFile(
      ctx.session.default.file,
      ctx.session.default.sessionId,
    );
    await storeDoc(pages, id);
    console.log("Enterinig conversation with file");
    ctx.reply("Entering chat");
    ctx.session.pages = [];
    await ctx.conversation.enter("chat");
  });

  !isSubscribed && range.row();

  if (isSubscribed) {
    range
      .text("Summarize", async (ctx) => {
        const id = await saveFile(
          ctx.session.default.file,
          ctx.session.default.sessionId,
        );
        const msg = await ctx.reply("Summarizing...");
        const text = await summarizeDoc(id, pages);
        ctx.api.editMessageText(
          msg.chat.id,
          msg.message_id,
          "Answer:\n" + text,
        );
        ctx.session.pages = [];
      })
      .row();
  }
  range
    .text("Save", async (ctx) => {
      const id = await saveFile(
        ctx.session.default.file,
        ctx.session.default.sessionId,
      );
      ctx.session.default.file.fileId = id;
      await ctx.reply(`File ${ctx.session.default.file.name} is saved`);
      return;
    })
    .row();
});
