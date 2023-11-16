import fs from "fs";
import { logger } from "../logger";

export const unlinkFile = async (path: string) => {
  fs.unlink(path, (error) => {
    if (error) {
      logger.error(`Error while unlinkig file ${path} - ${error}`);
      throw error;
    }
  });
};
