import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { Subscription } from "../subscription";
import { OpenAIAdapter } from "../openai";
import { PdfHandler } from "../pdf";

const fileMenu = new Menu<BotContext>("file");

fileMenu.dynamic(async (ctx, range) => {
  // const openai = new OpenAIAdapter();
  const pdf = new PdfHandler();
  const subscription = new Subscription(ctx.from.id.toString());
  const isSubscribe = await subscription.isSubscribed();

  const id = ctx.session.file.fileId;
  range.text(ctx.t("chat_button"), async (ctx) => {
    const files = ctx.session.files;
    const { name } = files.find((f) => f.fileId === id);
    ctx.reply(ctx.t("chat_enter", { fileName: name }), {
      parse_mode: "HTML",
    });
    await ctx.conversation.enter("chat");
  });

  if (!isSubscribe) {
    range.row();
  } else {
    range
      .text(ctx.t("summarize_button"), async (ctx) => {
        const msg = await ctx.reply(ctx.t("chat_loader"));
        const translateText =
          ctx.session.__language_code === "ru" ? true : false;
        const text = await pdf.summarize(id, translateText);
        await msg.editText(ctx.t("chat_assistant") + "\n" + text, {
          parse_mode: "HTML",
        });
      })
      .row();
  }
  // range
  //   .text("Delete", async (ctx) => {
  //     const id = ctx.session.file.fileId;
  //     const files = ctx.session.files;
  //     const { name } = files.find((f) => f.fileId === id);
  //     try {
  //       await db.$transaction([
  //         db.message.deleteMany({ where: { fileId: id } }),
  //         db.document.deleteMany({ where: { fileId: id } }),
  //         db.file.delete({ where: { id: id } }),
  //       ]);
  //       ctx.session.files = files.filter((f) => f.fileId !== id);
  //       console.log(`File ${name} deleted succsesfully`);
  //       ctx.reply(`File ${name} deleted succsesfully`);
  //       if (ctx.session.files.length !== 0) {
  //         ctx.menu.back();
  //       }
  //     } catch (error) {
  //       console.log("Error while deleting file", error);
  //       throw error;
  //     }
  //   })
  //   .row()
  range.back(ctx.t("back"), async (ctx) => {
    await ctx.editMessageText(
      ctx.t("files_menu_text", { count: ctx.session.files.length }),
      { parse_mode: "HTML" },
    );
  });
});

export const filesMenu = new Menu<BotContext>("files");

filesMenu.dynamic((ctx, range) => {
  const files = ctx.session.files;
  files.forEach((file) =>
    range
      .submenu("📄" + " " + file.name, "file", async (ctx) => {
        ctx.session.file.fileId = file.fileId;
        await ctx.editMessageText(
          ctx.t("files_file_option", { file: file.name }),
          { parse_mode: "HTML" },
        );
      })
      .row(),
  );
  return range;
});

filesMenu.register(fileMenu);
