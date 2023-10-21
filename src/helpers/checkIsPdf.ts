export const checkIsPdf = (filePath: string) => {
  return filePath.split(".").pop()?.toLowerCase() === "pdf";
};
