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
import { checkIsPdf, createTmpPath, getDuration, getPriceId } from "./helpers";
import { parsePdf } from "./utils";
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
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  bot.api.config.use(hydrateFiles(bot.token));

  bot.use(
    session({
      type: "multi",
      default: {
        storage: new PrismaAdapter<{
          fileId: string | null;
          sessionId: string | null;
        }>(db.session),
        initial: () => INIT_SESSION,
      },
      pages: {
        initial: () => null,
      },
      conversation: {
        initial: () => INIT_SESSION,
      },
    }),
  );

  bot.use(getSession);

  bot.use(conversations());

  bot.use(settingsMenu);

  bot.command("start", async (ctx) => {
    const session = await db.session.findFirst({
      where: {
        key: ctx.from?.id!.toString(),
      },
    });

    ctx.session.default.sessionId
      ? (ctx.session.default.sessionId = session.id)
      : null;

    ctx.session.default.language =
      ctx.msg.from.language_code === "ru" ? "russian" : "english";

    ctx.reply("Welcome to chat with pdf bot!");
  });

  bot.command("settings", async (ctx) => {
    ctx.reply("Settings:", {
      reply_markup: settingsMenu,
    });
  });

  bot.on("pre_checkout_query", (ctx) => {
    ctx.answerPreCheckoutQuery(true);
  });

  bot.on(":successful_payment", async (ctx) => {
    const { id: sessionId } = await db.session.findFirst({
      where: {
        key: ctx.from.id.toString(),
      },
    });
    console.log(ctx.message.successful_payment.invoice_payload);
    const payload = JSON.parse(
      ctx.message.successful_payment.invoice_payload,
    ) as PayloadType;
    const currentDate = new Date();
    const endedAt = new Date(currentDate);
    const durationInMonths = getDuration(payload.period);
    const priceID = getPriceId(payload.period);
    endedAt.setMonth(endedAt.getMonth() + durationInMonths);
    try {
      const subscription = await db.subscription.create({
        data: {
          sessionId: sessionId,
          priceId: priceID,
          endedAt: endedAt,
        },
      });
    } catch (error) {
      console.log(error);
    }
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
    const document = await ctx.getFile();
    const fileName = ctx.message.document.file_name!;
    const fileKey = document.file_id!;
    const filePath = document.file_path!;
    const url = document.getUrl();
    const isPdf = checkIsPdf(filePath!);
    const dlPath = createTmpPath(fileKey);

    if (isPdf) {
      const session = await db.session.findFirst({
        where: {
          key: ctx.from?.id!.toString(),
        },
      });
      const file = {
        key: fileKey,
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
        const createdFile = await db.file.create({
          data: {
            key: file.key,
            name: file.name,
            url: file.url,
            sessionId: session.id,
          },
        });

        const path = await document.download(dlPath);

        const pages = await parsePdf(path);

        ctx.session.pages = pages;

        ctx.session.default.fileId = createdFile.id;

        ctx.session.default.sessionId = session.id;

        ctx.reply("Choose what you want to do:", {
          reply_markup: interactMenu,
        });
      }
    } else {
      ctx.reply("File must be a pdf document");
    }
  });

  bot.start();
}
bootstrap();
