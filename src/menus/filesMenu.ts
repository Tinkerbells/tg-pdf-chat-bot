import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const filesMenu = new Menu<BotContext>("files");

filesMenu.dynamic((ctx, range) => {
  const files = ctx.session.default.files;
  files.forEach((file) =>
    range
      .text(file.name, async () => {
        ctx.session.default.fileId = file.fileId;
        console.log("Enterinig conversation with file", file.name);
        ctx.reply("chat with file - " + file.name + "is ready");
        await ctx.conversation.enter("chat");
      })
      .row(),
  );
  return range;
});
