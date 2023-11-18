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
  rootMenu,
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
import {
  documentComposer,
  filesComposer,
  leaveComposer,
  mainComposer,
  paymentComposer,
  settingsComposer,
} from "./composers";
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

// menuts
bot.use(rootMenu);

// Composers and conversations
bot.use(mainComposer);
bot.use(settingsComposer);
bot.use(leaveComposer);

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
