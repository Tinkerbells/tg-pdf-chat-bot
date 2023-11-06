import { db } from "../db";
import { FileType } from "../types/session";

export const saveFile = async (file: FileType, sessionId: string) => {
  const { id } = await db.file.create({
    data: {
      name: file.name,
      url: file.url,
      sessionId: sessionId,
    },
  });
  return id;
};
