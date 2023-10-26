import ffmpeg from "fluent-ffmpeg";

export const convertMp3 = (path: string, outputPath: string) => {
  try {
    return new Promise((resolve, reject) => {
      ffmpeg(path)
        .inputOption("-t 30")
        .output(outputPath)
        .on("end", () => resolve(outputPath))
        .on("error", (err) => reject(err.message))
        .run();
    });
  } catch (e) {
    console.log("Error while creating mp3", e.message);
  }
};
