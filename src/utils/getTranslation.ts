import { openai } from "../lib";

export const getTranslation = async (text: string, language: string) => {
  console.log("Getting translation...");
  const prompt = `Translate '${text}' from English to ${language}`;
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
