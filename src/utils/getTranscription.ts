import { openai } from "../lib";
import fs from "fs";

export const getTranscription = async (path: string) => {
  try {
    const response = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(path),
    });
    return response.text;
  } catch (error) {
    console.log("Error while transcription", error.message);
    throw error;
  }
};
