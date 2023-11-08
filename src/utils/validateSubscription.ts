import { db } from "../db";

export const validateSubscription = async (isSubscribe: number | boolean) => {
  const files = await db.file.findMany();
  let maxFiles = 10;
  if (isSubscribe) {
    maxFiles = 25;
  }
  const isMax = files.length++ !== maxFiles;

  return isMax;
};
