import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const disableAdviceMenu = new Menu<BotContext>("advice");

disableAdviceMenu.dynamic(async (ctx, range) => {
  range.text(ctx.t("advice_button"), async (ctx) => {
    ctx.session.showAdvice = false;
    ctx.deleteMessage();
  });
});
