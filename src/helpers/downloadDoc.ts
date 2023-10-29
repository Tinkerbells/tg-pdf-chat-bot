import { DownloaderHelper } from "node-downloader-helper";
import { createTmpPath } from "./createTmpPath";
import os from "os";

export const downloadDoc = async (url: string, id: string) => {
  const tmpDir = os.tmpdir();

  const dl = new DownloaderHelper(url, tmpDir);

  return new Promise<string>((resolve, reject) => {
    dl.on("end", (info) => {
      resolve(info.filePath);
    });
    dl.on("error", (error) => {
      console.log("Download Failed", error), reject(error);
    });
    dl.start().catch((error) => console.error(error));
  });
};
