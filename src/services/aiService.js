import OpenAI from 'openai';

/**
 * Service to handle OpenAI API calls for generating revision sheets
 */
export const aiService = {
  generateRevisionSheet: async (content, modelStr, apiKey) => {
    if (!apiKey) {
      throw new Error("OpenAI API key is missing. Please provide it in the .env file.");
    }

    if (!content || content.trim().length === 0) {
      throw new Error("Please add some notes before generating a revision sheet.");
    }

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // This is for local-first testing
      });

      const requestPayload = {
        model: modelStr || "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert UPSC instructor creating a one-pager revision sheet.
            
            STRICT RULES:
            - Keep the revision sheet in the exact SAME format and structure as the original sheet.
            - ONLY use information from the provided original text. Do NOT add any external knowledge, facts, or internet data under any circumstances.
            - Do NOT remove anything important. Condense only the fluff to ensure it fits as a high-yield revision notes.
            - Dont write everything verbatim, I will use this sheet to revise quickly. So, include only things that are crucial and imporatnt to revise. Answer in bullet points or with ";" if needed. I want minimal but i should be revise everything important
            - Extract and highlight key facts (Articles, Dates, Committees, Judgments) ONLY if they already exist in the text.`
          },
          {
            role: "user",
            content: `Here are my notes. Create a UPSC revision sheet from this:\n\n${content}`
          }
        ]
      };

      // Newer reasoning models often reject custom temperatures
      if (modelStr && (modelStr.includes('5.5') || modelStr.includes('o1') || modelStr.includes('o3') || modelStr.includes('o4'))) {
        requestPayload.temperature = 1;
      } else {
        requestPayload.temperature = 1;
      }

      const response = await openai.chat.completions.create(requestPayload);

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generating revision sheet:", error);
      throw error;
    }
  }
};
