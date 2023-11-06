import { openai } from "../lib";

export const detectLanguage = async (detectingPart: string) => {
  console.log("Detecting language...");
  const prompt = `Detect language of this text ${detectingPart} and return it's language code`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [{ role: "assistant", content: prompt }],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.log("Error while getting completions:", error);
    throw error;
  }
};
