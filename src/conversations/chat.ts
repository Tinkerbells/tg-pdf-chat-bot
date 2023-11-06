import { Conversation } from "@grammyjs/conversations";
import { getCompletions, getMatches, getTranscription } from "../utils";
import {
  convertMp3,
  createAssistantPrompt,
  createTmpPath,
  unlinkFile,
} from "../helpers";
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

    if (ctx.message!.text!.charAt(0) === "/") {
      ctx.reply('Please ask question without "/" in the begging');
    } else {
      let userMessage = "";

      // Converting telegram voice message to text
      if (ctx.message.voice) {
        const audio = await ctx.getFile();
        if (audio.file_size > 24 * 1024 * 1024) {
          ctx.reply("Voice message to large!");
          break;
        }
        const path = await audio.download(
          createTmpPath(audio.file_id) + ".oga",
        );
        const outputPath = path.replace(".oga", ".mp3");
        await convertMp3(path, outputPath);
        userMessage = await getTranscription(outputPath);
        ctx.reply("Your question:\n" + userMessage);
        await unlinkFile(path);
      } else {
        userMessage = ctx.message.text;
      }

      const sessionId = conversation.session.conversation.sessionId;
      const fileId = conversation.session.conversation.file.fileId;
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

      const context = results
        .map((r) => r.pageContent)
        .join("\n\n")
        .slice(0, 3500); // slice before achieving max tokens

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
    }
  }
};
