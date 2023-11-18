import { Conversation } from "@grammyjs/conversations";
import { createAssistantPrompt, createTmpPath, unlinkFile } from "../helpers";
import { db } from "../db";
import type { BotContext } from "..";
import { OpenAIAdapter } from "../openai";
import type { MessageType } from "../types/openai";
import { OggConvertor } from "../oggConvertor";
import { Subscription } from "../subscription";
import { PdfHandler } from "../pdf";
import { disableAdviceMenu, leaveMenu } from "../menus";

type ChatPdfConversation = Conversation<BotContext>;

export const chat = async (
  conversation: ChatPdfConversation,
  ctx: BotContext,
) => {
  if (conversation.session.showAdvice) {
    await ctx.reply(ctx.t("advice"), {
      reply_markup: disableAdviceMenu,
      parse_mode: "HTML",
    });
  }
  const openai = new OpenAIAdapter();
  while (true) {
    ctx = await conversation.waitFor("message");
    const sessionId = ctx.from.id.toString();
    const fileId = conversation.session.file.fileId;

    // Converting telegram voice message to text
    let userMessage = "";
    if (ctx.message.voice) {
      const subscription = new Subscription(sessionId);
      const isSubscribed = await conversation.external(() =>
        subscription.isSubscribed(),
      );
      if (!isSubscribed) {
        await ctx.reply(ctx.t("subscription_voice_warning"), {
          reply_markup: leaveMenu,
        });
        continue;
      }

      const audio = await ctx.getFile();

      // check if audio file is less than 25mb for openai api
      if (audio.file_size > 24 * 1024 * 1024) {
        await ctx.reply(ctx.t("chat_voice_large_warning"), {
          reply_markup: leaveMenu,
        });
        continue;
      }

      const tmp = createTmpPath(audio.file_id) + ".oga";
      const path = await conversation.external(() => audio.download(tmp));
      const outputPath = path.replace(".oga", ".mp3");
      const oggCovertor = new OggConvertor();
      await conversation.external(() => oggCovertor.toMp3(path, outputPath));
      userMessage = await conversation.external(() =>
        openai.transcription(outputPath),
      );
      await ctx.reply("🎤 :" + userMessage);
      await conversation.external(() => unlinkFile(path));
    } else if (ctx.message.text.charAt(0) === "/") {
      await ctx.reply(ctx.t("chat_command_warning"), {
        reply_markup: leaveMenu,
        parse_mode: "HTML",
      });
      continue;
    } else {
      userMessage = ctx.message.text;
    }

    const message = await conversation.external(() =>
      db.message.create({
        data: {
          text: userMessage,
          isUserMessage: true,
          fileId: fileId,
          sessionId: sessionId,
        },
      }),
    );

    const prevMessages = await conversation.external(() =>
      db.message.findMany({
        where: { fileId },
        orderBy: {
          createdAt: "asc",
        },
        take: 4,
      }),
    );

    const formattedPrevMessages = prevMessages.map((msg) => ({
      role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
      content: msg.text,
    }));

    const pdf = new PdfHandler();

    const results = await conversation.external(() =>
      pdf.matches(message.text, fileId),
    );

    const context = results
      .map((r) => r.pageContent)
      .join("\n\n")
      .slice(0, 4000); // slice before achieving max tokens

    const assistantMessage = createAssistantPrompt(
      context,
      formattedPrevMessages
        .map((message) => {
          if (message.role === "user") return `User: ${message.content}\n`;
          return `Assistant: ${message.content}\n`;
        })
        .join("\n"),
    );

    const msg = await ctx.reply(ctx.t("chat_loader"));

    const messages = [
      { role: openai.roles.ASSISTANT, content: assistantMessage },
      { role: openai.roles.USER, content: message.text },
    ];

    const result = await conversation.external(() =>
      openai.chat(messages as MessageType[]),
    );
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      ctx.t("chat_assistant") + "\n" + result,
      { reply_markup: leaveMenu, parse_mode: "HTML" },
    );

    await conversation.external(() =>
      db.message.create({
        data: {
          text: result,
          isUserMessage: false,
          fileId,
          sessionId: sessionId,
        },
      }),
    );
  }
};
