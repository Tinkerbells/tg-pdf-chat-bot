import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import {
  getSubscription,
  parsePdf,
  saveFile,
  storeDoc,
  summarizeDoc,
} from "../utils";
import { Subscription } from "../subscription";
import { MAX_PAGES_LIMIT_FREE, MAX_PAGES_LIMIT_PRO } from "../consts";

export const interactMenu = new Menu<BotContext>("interact");

interactMenu.dynamic(async (ctx, range) => {
  const subscription = new Subscription();
  const sessionId = ctx.from.id.toString();
  const isSubscribe = await subscription.isSubscribed(sessionId);
  range.text("Chat", async (ctx) => {
    const pages = await parsePdf(ctx.session.downloadFilepath);
    const maxLimitPages = isSubscribe
      ? MAX_PAGES_LIMIT_PRO
      : MAX_PAGES_LIMIT_FREE;
    if (pages.length > maxLimitPages) {
      await ctx.reply(
        "Too many pages in document!" + !isSubscribe &&
          "\n/subscribe to get more pags per document",
      );
    }
    const id = await saveFile(ctx.session.file, sessionId);
    await storeDoc(pages, id);
    console.log("Enterinig conversation with file");
    ctx.reply("Entering chat");
    ctx.session.file.fileId = id;
    await ctx.conversation.enter("chat");
  });

  if (isSubscribe) {
    range.row();
  } else {
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
      // await storeDoc(pages, id);
      ctx.session.filesCount++;
      ctx.session.file.fileId = id;
      await ctx.reply(`File ${ctx.session.file.name} is saved`);
      return;
    })
    .row();
  range.url("Open in browser", ctx.session.file.url).row();
});
