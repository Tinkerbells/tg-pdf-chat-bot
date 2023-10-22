import fs from "fs";

export const unlinkFile = async (path: string) => {
  fs.unlink(path, (error) => {
    if (error) {
      console.log(`Error while unlinkig file ${path}`, error);
      return;
    }
    console.log("File deleted successfully");
  });
};
