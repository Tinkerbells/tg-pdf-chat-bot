import { Composer } from "grammy";
import { BotContext } from "..";
import { db } from "../db";
import { createTmpPath } from "../helpers";
import { interactMenu } from "../menus";
import { Subscription } from "../subscription";
import { getDateDifference } from "../utils";
import { PdfHandler } from "../pdf";

export const documentComposer = new Composer<BotContext>();

// const allowUser = "641130142";

documentComposer.on([":document"], async (ctx) => {
  // const session = await db.session.findFirst({
  //   where: {
  //     id: ctx.from?.id!.toString(),
  //   },
  // });

  // TODO remove this after testing
  // if (session.id !== allowUser) {
  //   await ctx.reply(
  //     "You are not allow to use this bot, still in development sorry!",
  //   );
  //   return;
  // }
  const subscription = new Subscription(ctx.from.id.toString());

  const isSubscribed = await subscription.isSubscribed();

  const document = await ctx.getFile();
  const fileName = ctx.message.document.file_name;
  const fileKey = document.file_id;
  const filePath = document.file_path;
  const url = document.getUrl();
  const pdf = new PdfHandler(ctx, filePath);
  const isPdf = pdf.check();
  const dlPath = createTmpPath(fileKey);

  if (isPdf) {
    const file = {
      name: fileName,
      url: url,
    };

    const uniqueFile = await db.file.findFirst({
      where: {
        name: file.name,
      },
    });

    if (uniqueFile) {
      console.log("File already exsist");
      await ctx.reply(ctx.t("files_already_exist"));
    } else {
      ctx.session.file = file;

      const path = await document.download(dlPath);

      // Validation
      const { maxFiles } = await subscription.limits();
      const now = new Date();
      const timeout = ctx.session.filesUploadTimeout;
      let isValid = true;

      if (timeout) {
        isValid = getDateDifference(ctx.session.filesUploadTimeout, now) > 0;
      }

      if (ctx.session.filesCount + 1 < maxFiles && isValid) {
        ctx.session.downloadFilepath = path;
        await ctx.reply(ctx.t("interact_menu_text"), {
          reply_markup: interactMenu,
        });
      } else {
        ctx.session.filesCount = 0;
        ctx.session.filesUploadTimeout = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        );
        if (isSubscribed) {
          await ctx.reply(ctx.t("subscription_files_limit_warning"));
          return;
        }
        await ctx.reply(ctx.t("subscription_free_files_limit_warning"));
      }
    }
  } else {
    await ctx.reply(ctx.t("files_pdf_only_warning"));
  }
});
