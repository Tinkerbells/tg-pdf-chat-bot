import { Conversation } from "@grammyjs/conversations";
import { getCompletions, getMatches } from "../utils";
import { createAssistantPrompt } from "../helpers";
import { db } from "../db";
import { BotContext } from "..";
import { InlineKeyboard } from "grammy";

type ChatPdfConversation = Conversation<BotContext>;

const replyKeyboard = new InlineKeyboard().text("Leave chat", "leave");

export const chat = async (
  conversation: ChatPdfConversation,
  ctx: BotContext,
) => {
  while (true) {
    ctx = await conversation.wait();
    if (!ctx.message) {
      break;
    }
    if (ctx.message.text && ctx.message.text.charAt(0) !== "/") {
      const { fileId, sessionId } = conversation.session.default;
      const message = await conversation.external(() =>
        db.message.create({
          data: {
            text: ctx.message.text,
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
          take: 6,
        }),
      );

      const formattedPrevMessages = prevMessages.map((msg) => ({
        role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
        content: msg.text,
      }));

      const results = await conversation.external(() =>
        getMatches(message.text, fileId),
      );

      const context = results.map((r) => r.pageContent).join("\n\n");

      const assistantPrompt = createAssistantPrompt(
        context,
        formattedPrevMessages
          .map((message) => {
            if (message.role === "user") return `User: ${message.content}\n`;
            return `Assistant: ${message.content}\n`;
          })
          .join("\n"),
      );

      const msg = await ctx.reply("Generating answer...");

      const result = await conversation.external(() =>
        getCompletions(assistantPrompt, message.text),
      );

      await ctx.api.editMessageText(
        msg.chat.id,
        msg.message_id,
        "Assistant answer:\n" + result,
        { reply_markup: replyKeyboard },
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
    } else {
      ctx.reply(
        "Prompt should not start with /\nIf you want to leave chat type /leave",
      );
    }
  }
};
