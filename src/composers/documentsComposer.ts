import { Composer } from "grammy";
import { BotContext } from "..";
import { db } from "../db";
import { checkIsPdf, createTmpPath } from "../helpers";
import { interactMenu } from "../menus";
import { Subscription } from "../subscription";
import { MAX_FILE_LIMIT_FREE, MAX_FILE_LIMIT_PRO } from "../consts";

export const documentComposer = new Composer<BotContext>();

const allowUser = "641130142";

documentComposer.on([":document"], async (ctx) => {
  const session = await db.session.findFirst({
    where: {
      id: ctx.from?.id!.toString(),
    },
  });

  // TODO remove this after testing
  if (session.id !== allowUser) {
    await ctx.reply(
      "You are not allow to use this bot, still in development sorry!",
    );
    return;
  }
  const subscription = new Subscription();

  const isSubscribed = await subscription.isSubscribed(ctx.from.id.toString());

  const document = await ctx.getFile();
  const fileName = ctx.message.document.file_name;
  const fileKey = document.file_id;
  const filePath = document.file_path;
  const url = document.getUrl();
  const isPdf = checkIsPdf(filePath!);
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
      await ctx.reply("File already exsist!");
    } else {
      ctx.session.file = file;

      const path = await document.download(dlPath);

      // Validation
      const maxFilesLimit = isSubscribed
        ? MAX_FILE_LIMIT_PRO
        : MAX_FILE_LIMIT_FREE;
      const now = new Date();

      const timeout =
        ctx.session.filesUploadTimeout &&
        subscription.getDateDifference(ctx.session.filesUploadTimeout, now) < 0;

      if (ctx.session.filesCount++ <= maxFilesLimit && !timeout) {
        ctx.session.downloadFilepath = path;

        await ctx.reply("Choose what you want to do:", {
          reply_markup: interactMenu,
        });
      } else {
        const timeout = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        ctx.session.filesUploadTimeout = timeout;
        await ctx.reply(
          "You reached max files for free tier\nSubscribe for more options",
        );
      }
    }
  } else {
    await ctx.reply("File must be a pdf document");
  }
});
