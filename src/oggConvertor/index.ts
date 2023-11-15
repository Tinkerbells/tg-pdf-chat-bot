import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";

export class OggConvertor {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path);
  }
  toMp3(filepath: string, outputPath: string) {
    try {
      return new Promise((resolve, reject) => {
        ffmpeg(filepath)
          .inputOption("-t 30")
          .output(outputPath)
          .on("end", () => resolve(outputPath))
          .on("error", (err) => reject(err.message))
          .run();
      });
    } catch (e) {
      console.log("Error while creating mp3", e.message);
      throw e;
    }
  }
}