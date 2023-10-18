import TelegramBot from "node-telegram-bot-api";
import { env } from "./env/env";

const bot = new TelegramBot(env.BOT_TOKEN, { polling: true });

bot.on("document", async (msg) => {
  const { document } = msg;

  // Extract relevant information from the document

  const fileId = document!.file_id;
  const url = await bot.getFileLink(fileId);
  const fileName = document!.file_name;
  const fileSize = document!.file_size;
  const mimeType = document!.mime_type;

  console.log("Received document:", fileName);

  // Check if the document is a PDF based on MIME type
  if (mimeType === "application/pdf") {
    console.log("The document is a PDF.");
    // Additional logic for handling PDF files, if needed
  } else {
    console.log("The document is not a PDF.");
    return; // Skip processing for non-PDF documents
  }

  // Rest of the code to download and save the document to the database...
});
