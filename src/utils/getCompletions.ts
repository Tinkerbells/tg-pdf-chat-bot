import { openai } from "../lib";

export const getCompletions = async (
  assistantPrompt: string,
  userPrompt: string,
) => {
  console.log("Getting AI answer...");
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [
        { role: "assistant", content: assistantPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.log("Error while getting completions:", error);
  }
};
