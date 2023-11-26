import { Conversation } from "@grammyjs/conversations";
import { createTmpPath, unlinkFile } from "../helpers";
import type { BotContext } from "..";
import { OpenAIAdapter } from "../openai";
import { OggConvertor } from "../oggConvertor";
import { PdfHandler } from "../pdf";
import { disableAdviceMenu } from "../menus";
import { InlineKeyboard } from "grammy";

type ChatPdfConversation = Conversation<BotContext>;

async function handleVoiceMessage(
  conversation: ChatPdfConversation,
  ctx: BotContext,
  keyboard: InlineKeyboard,
) {
  const openai = new OpenAIAdapter(ctx);
  const audio = await ctx.getFile();

  // check if audio file is less than 25mb for openai api
  if (audio.file_size > 24 * 1024 * 1024) {
    await ctx.reply(ctx.t("chat_voice_large_warning"), {
      reply_markup: keyboard,
    });
    return;
  }

  const tmp = createTmpPath(audio.file_id) + ".oga";
  const path = await conversation.external(() => audio.download(tmp));
  const outputPath = path.replace(".oga", ".mp3");
  const oggCovertor = new OggConvertor();
  await conversation.external(() => oggCovertor.toMp3(path, outputPath));
  const message = await conversation.external(() =>
    openai.transcription(outputPath),
  );
  await ctx.reply("🎤 :" + message);
  await conversation.external(() => unlinkFile(path));
  return message;
}

export const chat = async (
  conversation: ChatPdfConversation,
  ctx: BotContext,
) => {
  const pdf = new PdfHandler(ctx);
  if (conversation.session.showAdvice) {
    await ctx.reply(ctx.t("advice"), {
      reply_markup: disableAdviceMenu,
      parse_mode: "HTML",
    });
  }
  const fileId = conversation.session.file.fileId;
  const translateText =
    conversation.session.__language_code === "ru" ? true : false;
  const keyboard = new InlineKeyboard();

  keyboard.text(ctx.t("chat_leave"), "leave");

  let message = "";

  while (true) {
    ctx = await conversation.waitFor("message");
    if (ctx.message.voice) {
      message = await handleVoiceMessage(conversation, ctx, keyboard);
    } else if (ctx.message.text) {
      if (ctx.message.text.charAt(0) === "/") {
        await ctx.reply(ctx.t("chat_command_warning"), {
          reply_markup: keyboard,
          parse_mode: "HTML",
        });
        continue;
      }
      message = ctx.message.text;
    } else {
      await ctx.reply(ctx.t("chat_message_type_warning"), {
        reply_markup: keyboard,
      });
      continue;
    }

    const msg = await ctx.reply(ctx.t("chat_loader"));

    const result = await conversation.external(() =>
      pdf.chat(message, fileId, translateText),
    );

    if (result.length > 4096) {
      await ctx.api.editMessageText(
        msg.chat.id,
        msg.message_id,
        ctx.t("chat_assistant") + "\n" + result.splice(0, 4000) + "...",
      );
      await ctx.reply(ctx.t("chat_continue") + "\n" + result.splice(4000), {
        reply_markup: keyboard,
        parse_mode: "HTML",
      });
      continue;
    }
    await ctx.api.editMessageText(
      msg.chat.id,
      msg.message_id,
      ctx.t("chat_assistant") + "\n" + result,
      { reply_markup: keyboard, parse_mode: "HTML" },
    );
  }
};
