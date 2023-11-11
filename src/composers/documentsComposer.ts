import { Composer } from "grammy";
import { BotContext } from "..";
import { db } from "../db";
import { getSubscription, validateSubscription } from "../utils";
import { checkIsPdf, createTmpPath } from "../helpers";
import { interactMenu } from "../menus";

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

  const daysLeft = await getSubscription(ctx.from.id.toString());

  const document = await ctx.getFile();
  const fileName = ctx.message.document.file_name!;
  const fileKey = document.file_id!;
  const filePath = document.file_path!;
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
      ctx.reply("File already exsist!");
    } else {
      ctx.session.file = file;

      const path = await document.download(dlPath);

      const isValidated = validateSubscription(!daysLeft);

      if (isValidated) {
        ctx.session.downloadFilepath = path;

        ctx.reply("Choose what you want to do:", {
          reply_markup: interactMenu,
        });
      }
      if (daysLeft && !isValidated) {
        ctx.reply(
          "You reached max limits for free tier\nSubscribe for more options",
        );
      }
    }
  } else {
    ctx.reply("File must be a pdf document");
  }
});
