import { NextFunction, session } from "grammy";
import { BotContext } from "..";
import { db } from "../db";
import { getDateDifference } from "../utils";
import { logger } from "../logger";

export async function deleteFiles(
  ctx: BotContext,
  next: NextFunction, // is an alias for: () => Promise<void>
): Promise<void> {
  const sessionId = ctx.from.id.toString();
  const now = new Date();
  let deletedFilesId = [];

  const files = await db.file.findMany({
    where: {
      sessionId: sessionId,
    },
  });

  if (files.length < 1) {
    return await next();
  }

  files.map((file) => {
    if (getDateDifference(file.deletedAt, now) > 0) {
      deletedFilesId.push(file.id);
    }
  });

  if (deletedFilesId.length > 0) {
    deletedFilesId.forEach(async (id) => {
      try {
        await db.$transaction([
          db.message.deleteMany({ where: { fileId: id } }),
          db.document.deleteMany({ where: { fileId: id } }),
          db.file.delete({ where: { id: id } }),
        ]);
      } catch (error) {
        logger.error(`Error while deleting file: ${error}`);
        throw error;
      }
    });
  }

  await next();
}
