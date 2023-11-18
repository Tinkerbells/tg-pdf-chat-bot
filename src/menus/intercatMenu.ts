import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { Subscription } from "../subscription";
import { PdfHandler } from "../pdf";
import { OpenAIAdapter } from "../openai";

export const interactMenu = new Menu<BotContext>("interact");

interactMenu.dynamic(async (ctx, range) => {
  const sessionId = ctx.from.id.toString();
  const openai = new OpenAIAdapter();
  const pdf = new PdfHandler(ctx.session.downloadFilepath);
  const subscription = new Subscription(sessionId);
  const file = ctx.session.file;
  const isSubscribe = await subscription.isSubscribed();
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
        new Date().getTime() + 30 * 24 * 60 * 60 * 1000,
      );
      return false;
    }
    ctx.session.filesCount++;
    return true;
  };

  range.text(ctx.t("chat_button"), async (ctx) => {
    const filesValidation = await validateFiles();
    if (!filesValidation) {
      return;
    }
    const pages = await pdf.parse();
    const pagesValidaton = await validatePages(pages.length);
    if (!pagesValidaton) {
      return;
    }
    const id = await pdf.save(file, sessionId);
    await pdf.store(pages, id);
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
      .text(ctx.t("summarize_button"), async (ctx) => {
        const filesValidation = await validateFiles();
        if (!filesValidation) {
          return;
        }
        const pages = await pdf.parse();
        const pagesValidaton = await validatePages(pages.length);
        if (!pagesValidaton) {
          return;
        }
        const id = await pdf.save(file, sessionId);
        await pdf.store(pages, id);
        const text = await openai.summarizeDoc(id);
        const msg = await ctx.reply(ctx.t("chat_loader"));
        await msg.editText(ctx.t("chat_assistant") + "\n" + text, {
          parse_mode: "HTML",
        });
      })
      .row();
  }

  range
    .text(ctx.t("save_button"), async (ctx) => {
      const filesValidation = await validateFiles();
      console.log(filesValidation);
      if (!filesValidation) {
        return;
      }
      const pages = await pdf.parse();
      const pagesValidaton = await validatePages(pages.length);
      if (!pagesValidaton) {
        return;
      }
      const id = await pdf.save(file, sessionId);
      await pdf.store(pages, id);
      await ctx.reply(ctx.t("files_saved", { fileName: file.name }), {
        parse_mode: "HTML",
      });
      ctx.session.file.fileId = id;
      return;
    })
    .row();
  // range.url("Open in browser", file.url).row();
});
