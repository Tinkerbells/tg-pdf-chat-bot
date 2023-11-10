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
import { checkIsPdf, createTmpPath, getEndDate, getPriceId } from "./helpers";
import { getSessionKey, getSubscription, validateSubscription } from "./utils";
import { SessionType, type SessionData } from "./types/session";
import { PayloadType } from "./types/payload";
import { PrismaAdapter } from "./prismaAdapter";

import { run, sequentialize } from "@grammyjs/runner";
import { INIT_SESSION } from "./consts";

const allowUser = "641130142";

export type BotContext = FileFlavor<Context> &
  SessionFlavor<SessionType> &
  I18nFlavor &
  ConversationFlavor;

type BotApi = FileApiFlavor<Api>;

const i18n = new I18n<BotContext>({
  defaultLocale: "ru",
  useSession: true,
  directory: "locales", // Load all translation files from locales/.
  globalTranslationContext(ctx) {
    return {
      first_name: ctx.from?.first_name ?? "",
    };
  },
});

const bot = new Bot<BotContext, BotApi>(env.BOT_TOKEN);

bot.api.config.use(hydrateFiles(bot.token));

bot.use(sequentialize(getSessionKey));

bot.use(
  session({
    storage: new PrismaAdapter<SessionType>(db.session),
    initial: () => ({}),
    getSessionKey: getSessionKey,
    // },
    // downloadFilepath: {
    //   initial: () => null,
    //   getSessionKey: getSessionKey,
    // },
    // conversation: {
    //   getSessionKey: getSessionKey,
    // },
    // provider: {
    //   initial: () => {},
    //   getSessionKey: getSessionKey,
    // },
  }),
);

bot.use(i18n);

bot.use(conversations());

bot.use(settingsMenu);

bot.use(providersMenu);

bot.command("start", async (ctx) => {
  await ctx.reply(ctx.t("start"));
});

bot.command("subscribe", async (ctx) => {
  ctx.reply("You can subscribe using these methods:", {
    reply_markup: providersMenu,
  });
});

bot.command("language", async (ctx) => {
  if (ctx.match === "") {
    return await ctx.reply(ctx.t("language.specify-a-locale"));
  }

  // `i18n.locales` contains all the locales that have been registered
  if (!i18n.locales.includes(ctx.match)) {
    return await ctx.reply(ctx.t("language.invalid-locale"));
  }

  // `ctx.i18n.getLocale` returns the locale currently using.
  if ((await ctx.i18n.getLocale()) === ctx.match) {
    return await ctx.reply(ctx.t("language.already-set"));
  }
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
  const payload = JSON.parse(
    ctx.message.successful_payment.invoice_payload,
  ) as PayloadType;
  const priceID = getPriceId(payload.period);
  const endedAt = getEndDate(payload.period);
  await db.subscription.create({
    data: {
      sessionId: ctx.from.id.toString(),
      priceId: priceID,
      endedAt: endedAt,
    },
  });
  await ctx.reply(`You successfuly subscribed for ${payload.period}`);
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

bot.use(filesMenu);

bot.use(interactMenu);

bot.command("files", async (ctx) => {
  const files = await db.file.findMany({
    where: {
      sessionId: ctx.from.id.toString(),
    },
  });

  ctx.session.files = files.map((file) => {
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
//
bot.on([":document"], async (ctx) => {
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
