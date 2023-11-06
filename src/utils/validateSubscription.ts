import { db } from "../db";

export const validateSubscription = async (
  pagesLength: number,
  isSubscribe: number | boolean,
) => {
  const files = await db.file.findMany();
  let maxFiles = 10;
  let maxPagesPerFile = 5;
  if (isSubscribe) {
    maxFiles = 25;
    maxPagesPerFile = 25;
  }
  const isMax = files.length++ !== maxFiles;
  const isMaxPages = pagesLength++ !== maxPagesPerFile;

  console.log(isMaxPages, isMax, isSubscribe);
  return isMax && isMaxPages;
};
