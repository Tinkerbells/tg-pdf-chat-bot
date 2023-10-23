import { Bot, Context, session, SessionFlavor } from "grammy";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { ScenesSessionData, ScenesFlavor } from "grammy-scenes";
import { checkIsPdf, createTmpPath } from "./helpers";
import { env } from "./env";
import { db } from "./db";
import { parsePdf, storeDoc } from "./utils";
import {
  ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { chat } from "./conversations";

const allowUser = "641130142";

interface SessionData {
  default: { fileId: string | null; sessionId: string | null };
  conversation: { fileId: string | null; sessionId: string | null };
}

export type BotContext = FileFlavor<Context> &
  SessionFlavor<SessionData> &
  ScenesFlavor &
  ConversationFlavor;

async function bootstrap() {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  bot.api.config.use(hydrateFiles(bot.token));

  bot.use(
    session({
      type: "multi",
      default: {
        storage: new PrismaAdapter<{
          fileId: string | null;
          sessionId: string | null;
        }>(db.session),
        initial: () => ({ fileId: null, sessionId: null }),
      },
      conversation: {
        initial: () => ({ fileId: null, sessionId: null }),
      },
    }),
  );

  bot.use(conversations());

  bot.callbackQuery("leave", async (ctx) => {
    await ctx.conversation.exit("chat");
    await ctx.answerCallbackQuery("Left conversation");
  });

  // Getting telegram user id
  bot.command("start", async (ctx) => {
    const userId = ctx.from?.id;
    console.log(userId);
  });

  bot.command("leave", async (ctx) => {
    await ctx.conversation.exit();
    await ctx.reply("Leaving.");
  });

  bot.command("stats", async (ctx) => {
    // ctx.reply(`Already got ${ctx.session.files} docs!`);
    console.log(ctx.session);
  });

  bot.command("match", async (ctx) => {});

  bot.use(createConversation(chat));

  bot.on([":document"], async (ctx) => {
    console.log(ctx.session.default.sessionId);
    const session = await db.session.findFirst({
      where: {
        key: ctx.from?.id!.toString(),
      },
    });
    // TODO remove this after testing
    if (session.key !== allowUser) {
      await ctx.reply(
        "You are not allow use this bot, still in development sorry!",
      );
      return;
    }

    const document = await ctx.getFile();

    const fileKey = document.file_id!;
    const fileSize = document.file_size!;
    const filePath = document.file_path!;
    const url = document.getUrl();
    const isPdf = checkIsPdf(filePath!);
    const dlPath = createTmpPath(fileKey);

    // if (isPdf && fileSize < 4 * 1024 * 1024) {
    if (isPdf) {
      const session = await db.session.findFirst({
        where: {
          key: ctx.from?.id!.toString(),
        },
      });
      const file = {
        key: fileKey,
        name: filePath!,
        url: url,
      };
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

      ctx.session.default.fileId = createdFile.id;
      ctx.session.default.sessionId = session.id;

      await storeDoc(pages, createdFile.id);

      console.log("Enterinig conversation");
      console.log(ctx.session.default.fileId);
      await ctx.reply("The chat is started");
      ctx.conversation.enter("chat");
      // files + 1 < 10 && ctx.session.files++;
    } else {
      ctx.reply("File must be a pdf document, or size is more than 4mb");
    }
  });

  bot.start();
}

bootstrap();
