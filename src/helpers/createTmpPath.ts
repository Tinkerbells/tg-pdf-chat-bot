import os from "os";
import path from "path";

export const createTmpPath = (id: string) => {
  return path.join(os.tmpdir(), id);
};
