import { Bot, Context, session, SessionFlavor } from "grammy";
import { PrismaAdapter } from "@grammyjs/storage-prisma";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { checkIsPdf, createAssistantPrompt, createTmpPath } from "./helpers";
import { env } from "./env";
import { db } from "./db";
import { getMatches, parsePdf, storeDoc } from "./utils";
import {
  Conversation,
  ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { openai } from "./lib";

type MessageType = {
  text: string;
  isUserMessage: boolean;
};

interface SessionData {
  files: number;
}

type MyContext = FileFlavor<Context> &
  SessionFlavor<SessionData> &
  ConversationFlavor;

type ChatPdfConversation = Conversation<MyContext>;

async function chat(conversation: ChatPdfConversation, ctx: MyContext) {
  await ctx.reply("The chat is started");
  const { message } = await conversation.wait();
  if (message.text) {
    if (message.text.match("/")) {
      return;
    }
    if (message.text) {
      console.log("Message recieved:", message.text);
      const results = await getMatches(message.text);
      const context = results
        .map((r) => r.pageContent)
        .join("\n\n")
        .slice(0, 3800);

      const assistantPrompt = createAssistantPrompt(context);

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        messages: [
          { role: "assistant", content: assistantPrompt },
          { role: "user", content: message.text },
        ],
      });

      ctx.reply(response.choices[0].message.content);
    }
  }
}

async function bootstrap() {
  const bot = new Bot<MyContext>(env.BOT_TOKEN);

  bot.api.config.use(hydrateFiles(bot.token));

  bot.use(
    session({
      storage: new PrismaAdapter<SessionData>(db.session),
      initial: () => ({ files: 0 }),
    }),
  );

  bot.use(conversations());

  bot.use(createConversation(chat));

  bot.on([":document"], async (ctx) => {
    const files = ctx.session.files;
    const document = await ctx.getFile();
    console.log("@", files);

    if (files === 2) {
      ctx.reply("Too much files");
      return;
    }

    const fileId = document.file_id!;
    const fileSize = document.file_size!;
    const filePath = document.file_path!;
    const url = document.getUrl();
    const isPdf = checkIsPdf(filePath!);
    const dlPath = createTmpPath(fileId);

    // if (isPdf && fileSize < 4 * 1024 * 1024) {
    if (isPdf) {
      const session = await db.session.findFirst({
        where: {
          key: ctx.from?.id!.toString(),
        },
      });
      const file = {
        id: fileId,
        name: filePath!,
        url: url,
      };
      // const createdFile = await db.file.create({
      //   data: {
      //     key: file.id,
      //     name: file.name,
      //     url: file.url,
      //     sessionId: session.id,
      //   },
      // });
      //
      const path = await document.download(dlPath);

      const pages = await parsePdf(path);

      await storeDoc(pages);

      console.log("Enter conversation");

      await ctx.conversation.enter("chat");

      // files + 1 < 10 && ctx.session.files++;
    } else {
      ctx.reply("File must be a pdf document, or size is more than 4mb");
    }
  });

  // Getting telegram user id
  bot.command("start", async (ctx) => {
    const userId = ctx.from?.id;
    console.log(userId);
  });

  bot.command("stats", async (ctx) => {
    ctx.reply(`Already got ${ctx.session.files} docs!`);
  });

  bot.command("match", async (ctx) => {
    // await getMatches(embeddings, "1");
  });
  bot.start();
}

bootstrap();
