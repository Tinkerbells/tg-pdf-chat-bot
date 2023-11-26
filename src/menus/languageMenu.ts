import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";

export const languageMenu = new Menu<BotContext>("language");

languageMenu.dynamic(async (ctx, range) => {
  range
    .text("🇷🇺 Русский", async (ctx) => {
      if (ctx.session.__language_code !== "ru") {
        ctx.session.__language_code = "ru";
        await ctx.i18n.renegotiateLocale();
        if (!ctx.session.hideBack) {
          await ctx.editMessageText(ctx.t("language_default"), {
            parse_mode: "HTML",
          });
        } else {
          await ctx.editMessageText(ctx.t("start"), { parse_mode: "HTML" });
        }
      }
      await ctx.answerCallbackQuery(ctx.t("language_default"));
    })
    .text("🇺🇸 English", async (ctx) => {
      if (ctx.session.__language_code !== "en") {
        ctx.session.__language_code = "en";
        await ctx.i18n.renegotiateLocale();
        if (!ctx.session.hideBack) {
          await ctx.editMessageText(ctx.t("language_default"), {
            parse_mode: "HTML",
          });
        } else {
          await ctx.editMessageText(ctx.t("start"), { parse_mode: "HTML" });
        }
      }
      await ctx.answerCallbackQuery(ctx.t("language_default"));
    })
    .row();
  if (!ctx.session.hideBack) {
    range
      .back(ctx.t("back"), async (ctx) => {
        await ctx.editMessageText(ctx.t("settings_menu_text"));
      })
      .row();
  }
});
