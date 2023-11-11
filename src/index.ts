import {
  Api,
  Bot,
  Context,
  GrammyError,
  HttpError,
  session,
  SessionFlavor,
} from "grammy";
import { FileApiFlavor, FileFlavor, hydrateFiles } from "@grammyjs/files";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import { I18n, I18nFlavor } from "@grammyjs/i18n";
import {
  ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { chat } from "./conversations";
import { filesMenu, interactMenu, providersMenu, settingsMenu } from "./menus";
import { env } from "./env";
import { db } from "./db";
import { getSessionKey } from "./utils";
import { type SessionType } from "./types/session";
import { PrismaAdapter } from "./prismaAdapter";

import { run, sequentialize } from "@grammyjs/runner";
import { documentComposer, filesComposer, paymentComposer } from "./composers";

export type BotContext = HydrateFlavor<
  FileFlavor<Context> &
    SessionFlavor<SessionType> &
    I18nFlavor &
    ConversationFlavor
>;

type BotApi = FileApiFlavor<Api>;

const i18n = new I18n<BotContext>({
  defaultLocale: "en",
  useSession: true,
  directory: "locales",
  globalTranslationContext(ctx) {
    return {
      first_name: ctx.from?.first_name ?? "",
    };
  },
});

const bot = new Bot<BotContext, BotApi>(env.BOT_TOKEN);

bot.use(hydrate());

bot.api.config.use(hydrateFiles(bot.token));

bot.use(sequentialize(getSessionKey));

bot.use(
  session({
    storage: new PrismaAdapter<SessionType>(db.session),
    initial: () => ({}),
    getSessionKey: getSessionKey,
  }),
);

bot.use(i18n);

bot.use(conversations());

bot.use(settingsMenu);

bot.use(providersMenu);

bot.command("start", async (ctx) => {
  await ctx.reply(ctx.t("start"));
});

bot.command("settings", async (ctx) => {
  ctx.reply("Settings:", {
    reply_markup: settingsMenu,
  });
});

bot.command("leave", async (ctx) => {
  await ctx.conversation.exit();
  await db.message.deleteMany({
    where: {
      fileId: ctx.session.file.fileId,
    },
  });
  await ctx.reply("Leaving.");
});

bot.callbackQuery("leave", async (ctx) => {
  console.log("Leaving...");
  await ctx.conversation.exit("chat");
  await db.message.deleteMany({
    where: {
      fileId: ctx.session.file.fileId,
    },
  });
  await ctx.reply("Chat session is closed");
  await ctx.answerCallbackQuery("Left chat");
});

bot.use(createConversation(chat));

bot.use(paymentComposer);

bot.use(filesMenu);

bot.use(interactMenu);

bot.use(filesComposer);

bot.use(documentComposer);

run(bot);

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
