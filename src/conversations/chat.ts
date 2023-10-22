import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "..";
import { getMatches } from "../utils";
import { createAssistantPrompt } from "../helpers";
import { openai } from "../lib";
import { db } from "../db";
import { InlineKeyboard } from "grammy";

type ChatPdfConversation = Conversation<BotContext>;

export const chat = async (
  conversation: ChatPdfConversation,
  ctx: BotContext,
) => {
  while (true) {
    ctx = await conversation.wait();

    if (ctx.message.text) {
      const replyKeyboard = new InlineKeyboard().text("Leave chat", "leave");
      const fileId = ctx.session.fileId;
      const sessionId = ctx.session.sessionId;
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

      const response = await conversation.external(() => {
        console.log("@@@@@ Getting AI answer...");
        const res = openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          temperature: 0,
          messages: [
            { role: "assistant", content: assistantPrompt },
            { role: "user", content: message.text },
          ],
        });
        return res;
      });

      await ctx.reply(response.choices[0].message.content, {
        reply_markup: replyKeyboard,
      });
    }
  }
};
