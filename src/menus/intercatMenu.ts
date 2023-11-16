import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { parsePdf, saveFile, storeDoc, summarizeDoc } from "../utils";
import { Subscription } from "../subscription";

export const interactMenu = new Menu<BotContext>("interact");

interactMenu.dynamic(async (ctx, range) => {
  const file = ctx.session.file;
  const sessionId = ctx.from.id.toString();
  const subscription = new Subscription(sessionId);
  const isSubscribe = await subscription.isSubscribed();
  const now = new Date();
  const filesCount = ctx.session.filesCount;
  const { maxPages, maxFiles } = await subscription.limits();

  const validatePages = async (pages: number) => {
    if (pages > maxPages) {
      if (isSubscribe) {
        await ctx.reply(ctx.t("subscription_pages_limit_warning"));
      } else {
        await ctx.reply(ctx.t("subscription_free_pages_limit_warning"));
      }
      return false;
    }
    return true;
  };

  const validateFiles = async () => {
    if (filesCount + 1 > maxFiles) {
      if (isSubscribe) {
        await ctx.reply(ctx.t("subscription_files_limit_warning"));
      } else {
        await ctx.reply(ctx.t("subscription_free_files_limit_warning"));
      }
      ctx.session.filesUploadTimeout = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
      return false;
    }
    ctx.session.filesCount++;
    return true;
  };

  range.text("Chat", async (ctx) => {
    const filesValidation = await validateFiles();
    if (!filesValidation) {
      return;
    }
    const pages = await parsePdf(ctx.session.downloadFilepath);
    const pagesValidaton = await validatePages(pages.length);
    if (!pagesValidaton) {
      return;
    }
    const id = await saveFile(file, sessionId);
    await storeDoc(pages, id);
    console.log("Enterinig conversation with file");
    ctx.reply(ctx.t("chat_enter", { fileName: file.name }), {
      parse_mode: "HTML",
    });
    ctx.session.file.fileId = id;
    await ctx.conversation.enter("chat");
  });

  if (!isSubscribe) {
    range.row();
  } else {
    range
      .text("Summarize", async (ctx) => {
        const filesValidation = await validateFiles();
        if (!filesValidation) {
          return;
        }
        const pages = await parsePdf(ctx.session.downloadFilepath);
        const pagesValidaton = await validatePages(pages.length);
        if (!pagesValidaton) {
          return;
        }
        const id = await saveFile(file, sessionId);
        await storeDoc(pages, id);
        const msg = await ctx.reply(ctx.t("chat_loader"));
        const text = await summarizeDoc(id);
        await msg.editText(ctx.t("chat_assistant") + " " + text);
      })
      .row();
  }

  range
    .text("Save", async (ctx) => {
      const filesValidation = await validateFiles();
      console.log(filesValidation);
      if (!filesValidation) {
        return;
      }
      const pages = await parsePdf(ctx.session.downloadFilepath);
      const pagesValidaton = await validatePages(pages.length);
      if (!pagesValidaton) {
        return;
      }
      const id = await saveFile(file, sessionId);
      await storeDoc(pages, id);
      await ctx.reply(ctx.t("files_saved", { fileName: file.name }), {
        parse_mode: "HTML",
      });
      ctx.session.file.fileId = id;
      return;
    })
    .row();
  range.url("Open in browser", file.url).row();
});
