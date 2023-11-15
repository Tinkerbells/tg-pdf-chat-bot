import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { parsePdf, saveFile, storeDoc, summarizeDoc } from "../utils";
import { Subscription } from "../subscription";
import { MAX_PAGES_LIMIT_FREE } from "../consts";

export const interactMenu = new Menu<BotContext>("interact");

interactMenu.dynamic(async (ctx, range) => {
  const file = ctx.session.file;
  const sessionId = ctx.from.id.toString();
  const subscription = new Subscription(sessionId);
  const isSubscribe = await subscription.isSubscribed();

  const { maxPages } = await subscription.limits();
  const maxLimitPages = isSubscribe ? maxPages : MAX_PAGES_LIMIT_FREE;

  const validate = async (pages: number) => {
    if (pages > maxLimitPages) {
      if (isSubscribe) {
        await ctx.reply(ctx.t("subscription_pages_limit_warning"));
      } else {
        await ctx.reply(ctx.t("subscription_free_pages_limit_warning"));
      }
      return false;
    }
    return true;
  };

  range.text("Chat", async (ctx) => {
    const pages = await parsePdf(ctx.session.downloadFilepath);
    const validation = await validate(pages.length);
    if (!validation) {
      return;
    }
    const id = await saveFile(file, sessionId);
    await storeDoc(pages, id);
    console.log("Enterinig conversation with file");
    ctx.reply("Entering chat");
    ctx.session.file.fileId = id;
    await ctx.conversation.enter("chat");
  });

  if (!isSubscribe) {
    range.row();
  } else {
    range
      .text("Summarize", async (ctx) => {
        const pages = await parsePdf(ctx.session.downloadFilepath);
        const validation = await validate(pages.length);
        if (!validation) {
          return;
        }
        const id = await saveFile(file, sessionId);
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
      const validation = await validate(pages.length);
      if (!validation) {
        return;
      }
      const id = await saveFile(file, sessionId);
      console.log(file);
      // await storeDoc(pages, id);
      ctx.session.filesCount++;
      ctx.session.file.fileId = id;
      await ctx.reply(`File ${file.name} is saved`);
      return;
    })
    .row();
  range.url("Open in browser", file.url).row();
});
