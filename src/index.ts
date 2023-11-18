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
import {
  disableAdviceMenu,
  filesMenu,
  interactMenu,
  leaveMenu,
  providersMenu,
  settingsMenu,
  startMenu,
} from "./menus";
import { env } from "./env";
import { db, redis } from "./db";
import { getSessionKey } from "./utils";
import { type SessionType } from "./types/session";
import { PrismaAdapter } from "./prismaAdapter";
import { limit } from "@grammyjs/ratelimiter";
import { run, sequentialize } from "@grammyjs/runner";
import { documentComposer, filesComposer, paymentComposer } from "./composers";
import { INIT_SESSION } from "./consts";
import { deleteFiles, ignoreOld } from "./middlewares";
import { logger } from "./logger";

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

// additional plugins

bot.use(hydrate());

bot.api.config.use(hydrateFiles(bot.token));

bot.use(sequentialize(getSessionKey));

// sessions
bot.use(
  session({
    storage: new PrismaAdapter<SessionType>(db.session),
    initial: () => INIT_SESSION,
    getSessionKey: getSessionKey,
  }),
);

// custom middlewares
bot.use(ignoreOld);
bot.use(deleteFiles);

// ratelimiter;
bot.use(
  limit({
    // Allow only 3 messages to be handled every 2 seconds.
    timeFrame: 2000,
    limit: 3,

    storageClient: redis,

    onLimitExceeded: async (ctx) => {
      await ctx.reply("Please refrain from sending too many requests!");
    },

    keyGenerator: getSessionKey,
  }),
);

bot.use(i18n);

bot.use(conversations());

bot.use(settingsMenu);
bot.use(providersMenu);
bot.use(leaveMenu);
bot.use(startMenu);
bot.use(disableAdviceMenu);

bot.command("start", async (ctx) => {
  await bot.api.setMyCommands([
    {
      command: "start",
      description: "Start using the bot and get an introduction. ",
    },
    { command: "help", description: "Show list of available commands" },
    {
      command: "about",
      description: "Get information about bot.",
    },
    {
      command: "settings",
      description: "Access and modify your bot settings.",
    },
    {
      command: "subscribe",
      description: "Subscribe for a premium features.",
    },
    {
      command: "files",
      description: "Access and manage documents within the bot.",
    },
    {
      command: "leave",
      description: "To leave chat",
    },
  ]);
  await ctx.reply(ctx.t("start"), { reply_markup: startMenu });
  logger.info(`New user: ${ctx.from.username} - ${ctx.from.id}`);
});

bot.command("help", async (ctx) => {
  await ctx.reply(ctx.t("help"), { parse_mode: "HTML" });
});

bot.command("about", async (ctx) => {
  await ctx.reply(ctx.t("about"), { parse_mode: "HTML" });
});

bot.command("settings", async (ctx) => {
  ctx.reply(ctx.t("settings_menu_text"), {
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
  await ctx.reply(ctx.t("leave_mesasge"));
});

bot.callbackQuery("leave", async (ctx) => {
  await ctx.conversation.exit("chat");
  await db.message.deleteMany({
    where: {
      fileId: ctx.session.file.fileId,
    },
  });
  await ctx.reply(ctx.t("leave_mesasge"));
  await ctx.answerCallbackQuery("leave_chat");
});

bot.use(createConversation(chat));

bot.use(paymentComposer);

bot.use(filesMenu);

bot.use(interactMenu);

bot.use(filesComposer);

bot.use(documentComposer);

run(bot);

bot.catch(async (err) => {
  const ctx = err.ctx;
  logger.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    logger.error("Error in request:", e.description);
    if (ctx.chat) {
      await ctx.reply(ctx.t("error_message"));
    }
  } else if (e instanceof HttpError) {
    logger.error("Could not contact Telegram:", e);
    if (ctx.chat) {
      await ctx.reply(ctx.t("error_message"));
    }
  } else {
    logger.error("Unknown error:", e);
    if (ctx.chat) {
      await ctx.reply(ctx.t("error_message"));
    }
  }
});
