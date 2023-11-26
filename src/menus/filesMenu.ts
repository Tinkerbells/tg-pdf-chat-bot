import { Menu, MenuRange } from "@grammyjs/menu";
import { BotContext } from "..";
import { Subscription } from "../subscription";
import { PdfHandler } from "../pdf";
import { FileType } from "../prismaAdapter";

export const fileMenu = new Menu<BotContext>("file");

fileMenu.dynamic(async (ctx, range) => {
  const pdf = new PdfHandler(ctx);
  const subscription = new Subscription(ctx.from.id.toString());
  const isSubscribe = await subscription.isSubscribed();
  const id = ctx.session.file.fileId;
  const file = ctx.session.files.find((f) => f.fileId === id);
  range.text(ctx.t("chat_button"), async (ctx) => {
    ctx.reply(ctx.t("chat_enter", { fileName: file.name }), {
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
        msg.delete();
        await ctx.reply(ctx.t("chat_assistant") + "\n" + text, {
          parse_mode: "HTML",
          reply_markup: fileMenu,
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
  if (!ctx.session.hideBack) {
    range.text(ctx.t("back"), async (ctx) => {
      await ctx.editMessageText(
        ctx.t("files_menu_text", { count: ctx.session.files.length }),
        { parse_mode: "HTML" },
      );
      ctx.menu.nav("files");
    });
  }
});

export const filesMenu = new Menu<BotContext>("files");

const limit = 13;

filesMenu.dynamic((ctx, range) => {
  const current = ctx.session.currentFilesPage;
  let files = ctx.session.files;
  const maxPages = Math.ceil(files.length / limit);
  createFilesMenu(range, files, current);
  getPagination(ctx, range, current, maxPages);
  return range;
});

async function createFilesMenu(
  range: MenuRange<BotContext>,
  files: FileType[],
  current: number,
) {
  files.slice(current * limit - limit, current * limit).forEach((file) => {
    range
      .text("📄" + " " + file.name, async (ctx) => {
        ctx.session.file.fileId = file.fileId;
        await ctx.editMessageText(
          ctx.t("files_file_option", { file: file.name }),
          { parse_mode: "HTML", reply_markup: fileMenu },
        );
      })
      .row();
  });
  return range;
}

async function getPagination(
  ctx: BotContext,
  range: MenuRange<BotContext>,
  current: number,
  maxPages: number,
) {
  if (current === 1 && maxPages !== 1) {
    range.text(ctx.t("files_next"), (ctx) => {
      ctx.session.currentFilesPage++;
      ctx.menu.update();
    });
  }
  if (current === maxPages && maxPages !== 1) {
    range.text(ctx.t("files_prev"), (ctx) => {
      ctx.session.currentFilesPage--;
      ctx.menu.update();
    });
  }
  return range;
}
