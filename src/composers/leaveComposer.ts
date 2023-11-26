import { Composer } from "grammy";
import { BotContext } from "..";
import { fileMenu } from "../menus";

export const leaveComposer = new Composer<BotContext>();

leaveComposer.command("leave", async (ctx) => {
  const file = ctx.session.file;
  await ctx.conversation.exit();
  // await ctx.reply(ctx.t("leave_mesasge"));
  await ctx.reply(ctx.t("files_file_option", { file: file.name }), {
    reply_markup: fileMenu,
    parse_mode: "HTML",
  });
});

leaveComposer.callbackQuery("leave", async (ctx) => {
  const file = ctx.session.file;
  await ctx.conversation.exit("chat");
  // await ctx.reply(ctx.t("leave_mesasge"));
  await ctx.reply(ctx.t("files_file_option", { file: file.name }), {
    reply_markup: fileMenu,
    parse_mode: "HTML",
  });
  await ctx.answerCallbackQuery(ctx.t("leave_mesasge"));
});
