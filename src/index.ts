import { Bot, Context, session, SessionFlavor } from "grammy";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import {
  ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { checkIsPdf, createTmpPath } from "./helpers";
import { env } from "./env";
import { db } from "./db";
import { INIT_SESSION } from "./consts";
import { parsePdf, storeDoc, summarizeDoc } from "./utils";
import { chat } from "./conversations";
import { filesMenu } from "./menus";

const allowUser = "641130142";

type FileType = {
  name: string;
  fileId: string;
};

type SessionType = {
  fileId: string | null;
  sessionId: string | null;
  files: FileType[] | null;
  language: string;
};

interface SessionData {
  default: SessionType;
  conversation: SessionType;
}

export type BotContext = FileFlavor<Context> &
  SessionFlavor<SessionData> &
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
        initial: () => INIT_SESSION,
      },
      conversation: {
        initial: () => INIT_SESSION,
      },
    }),
  );

  bot.use(conversations());

  // Getting telegram user id
  bot.command("start", async (ctx) => {
    const session = await db.session.findFirst({
      where: {
        key: ctx.from?.id!.toString(),
      },
    });
    ctx.session.default.sessionId
      ? (ctx.session.default.sessionId = session.id)
      : null;
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

    ctx.reply("Your documents:", { reply_markup: filesMenu });
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
        name: fileName,
        url: url,
      };

      // const uniqueFile = await db.file.findFirst({
      //   where: {
      //     name: file.name,
      //   },
      // });
      const uniqueFile = false;
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

        ctx.session.default.fileId = createdFile.id;
        ctx.session.default.sessionId = session.id;

        await storeDoc(pages, createdFile.id);

        console.log("Enterinig conversation with file", file.name);
        console.log(ctx.session.default.fileId);
        ctx.reply("Chat with file - " + file.name + " " + "is ready");
        await ctx.conversation.enter("chat");
      }
    } else {
      ctx.reply("File must be a pdf document");
    }
  });

  bot.start();
}

bootstrap();
