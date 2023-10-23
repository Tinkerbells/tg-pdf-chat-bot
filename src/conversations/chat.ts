import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "..";
import { getMatches } from "../utils";
import { createAssistantPrompt } from "../helpers";
import { openai } from "../lib";
import { db } from "../db";
import { InlineKeyboard } from "grammy";

type ChatPdfConversation = Conversation<BotContext>;

const replyKeyboard = new InlineKeyboard().text("Leave chat", "leave");

export const chat = async (
  conversation: ChatPdfConversation,
  ctx: BotContext,
) => {
  let c = 0;
  while (true) {
    c++;
    ctx = await conversation.wait();
    if (ctx.message.text && ctx.message.text.charAt(0) !== "/") {
      const { fileId, sessionId } = ctx.session;
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

      let fullRespone = "";
      let messageText = "";

      await conversation.external(() =>
        console.log("@@@@@@@@@@@@@@ Getting AI answer..."),
      );

      const stream = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0,
        messages: [
          { role: "assistant", content: assistantPrompt },
          { role: "user", content: message.text },
        ],
        stream: true,
      });

      const msg = await ctx.reply("Assistant answer:\n");
      let counter = 0;
      for await (const chunk of stream) {
        const text = chunk.choices[0].delta.content ?? "";
        fullRespone += text;
        counter++;
        if (counter % 20 === 0) {
          messageText = fullRespone;
          await ctx.api.editMessageText(
            msg.chat.id.toString(),
            msg.message_id,
            "Assistant answer:\n" + messageText,
            {
              reply_markup: replyKeyboard,
            },
          );
        }
      }
      if (messageText !== fullRespone) {
        await ctx.api.editMessageText(
          msg.chat.id.toString(),
          msg.message_id,
          "Assistant answer:\n" + fullRespone,
          {
            reply_markup: replyKeyboard,
          },
        );
      }
      await conversation.external(() =>
        db.message.create({
          data: {
            text: fullRespone,
            isUserMessage: false,
            fileId,
            sessionId: sessionId,
          },
        }),
      );
      await conversation.external(() => console.log("This is a ", c));
    } else {
      ctx.reply(
        "Prompt should not start with /\nIf you want to leave chat type /leave",
      );
    }
  }
};
