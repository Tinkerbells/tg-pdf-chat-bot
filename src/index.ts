import {
  Bot,
  Context,
  GrammyError,
  HttpError,
  session,
  SessionFlavor,
} from "grammy";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import {
  ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { chat } from "./conversations";
import { filesMenu, interactMenu, settingsMenu } from "./menus";
import { env } from "./env";
import { db } from "./db";
import { INIT_SESSION } from "./consts";
import { checkIsPdf, createTmpPath, getEndDate, getPriceId } from "./helpers";
import { getSubscription, parsePdf, validateSubscription } from "./utils";
import { type SessionData } from "./types/session";
import { PayloadType } from "./types/payload";
import { getSession } from "./middleware";

const allowUser = "641130142";

export type BotContext = FileFlavor<Context> &
  SessionFlavor<SessionData> &
  ConversationFlavor;

async function bootstrap() {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
      if (ctx.chat) {
        ctx.reply("Oops, something goes wrong, please try again");
      }
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
      if (ctx.chat) {
        ctx.reply("Oops, something goes wrong, please try again");
      }
    } else {
      console.error("Unknown error:", e);
      if (ctx.chat) {
        ctx.reply("Oops, something goes wrong, please try again");
      }
    }
  });

  bot.api.config.use(hydrateFiles(bot.token));

  bot.use(
    session({
      type: "multi",
      default: {
        storage: new PrismaAdapter<SessionData>(db.session),
        initial: () => INIT_SESSION,
      },
      pages: {
        initial: () => null,
      },
      conversation: {
        initial: () => INIT_SESSION,
      },
      provider: {
        initial: () => null,
      },
    }),
  );

  bot.use(conversations());

  bot.use(settingsMenu);

  bot.command("start", async (ctx) => {
    ctx.reply("Welcome to chat with pdf bot!");
  });

  bot.use(getSession);

  bot.command("settings", async (ctx) => {
    ctx.reply("Settings:", {
      reply_markup: settingsMenu,
    });
  });

  bot.on("pre_checkout_query", (ctx) => {
    ctx.answerPreCheckoutQuery(true);
  });

  bot.on(":successful_payment", async (ctx) => {
    const payload = JSON.parse(
      ctx.message.successful_payment.invoice_payload,
    ) as PayloadType;
    const priceID = getPriceId(payload.period);
    const endedAt = getEndDate(payload.period);
    await db.subscription.create({
      data: {
        sessionId: ctx.session.default.sessionId,
        priceId: priceID,
        endedAt: endedAt,
      },
    });
  });

  bot.command("leave", async (ctx) => {
    await ctx.conversation.exit();
    await ctx.reply("Leaving.");
  });

  bot.callbackQuery("leave", async (ctx) => {
    console.log("Leaving...");
    await ctx.conversation.exit("chat");
    await ctx.reply("Chat session is closed");
    await ctx.answerCallbackQuery("Left chat");
  });

  bot.use(createConversation(chat));

  bot.use(filesMenu);

  bot.use(interactMenu);

  bot.command("files", async (ctx) => {
    const files = await db.file.findMany({
      where: {
        sessionId: ctx.session.default.sessionId,
      },
    });

    ctx.session.default.files = files.map((file) => {
      return {
        name: file.name,
        fileId: file.id,
      };
    });

    if (!!files.length) {
      ctx.reply(`You have ${files.length} pdf documents:`, {
        reply_markup: filesMenu,
      });
    } else {
      ctx.reply("You doesn't have any document yet");
    }
  });

  bot.on([":document"], async (ctx) => {
    const session = await db.session.findFirst({
      where: {
        key: ctx.from?.id!.toString(),
      },
    });

    // TODO remove this after testing
    if (session.key !== allowUser) {
      await ctx.reply(
        "You are not allow to use this bot, still in development sorry!",
      );
      return;
    }

    const daysLeft = await getSubscription(ctx.session.default.sessionId);

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
        ctx.session.default.file = file;

        const path = await document.download(dlPath);

        const pages = await parsePdf(path);

        const isValidated = validateSubscription(pages.length, !daysLeft);

        if (isValidated) {
          ctx.session.pages = pages;

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

  bot.start();
}
bootstrap();
