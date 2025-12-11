import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateAIPassword = async (prompt: string, length: number = 16): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash";
    const systemInstruction = `
      You are a cybersecurity expert specializing in generating high-entropy, cryptographically secure passwords based on user mnemonics or themes.
      
      Your goal is to output ONLY the generated password string. Do not include any explanation, markdown, or labels.
      
      Rules:
      1. The password must be at least ${length} characters long unless the prompt implies a specific constraint that makes this impossible (but prioritize length for security).
      2. It should include a mix of uppercase, lowercase, numbers, and symbols.
      3. If the user gives a theme (e.g. "space"), try to make it vaguely memorable but obfuscated (e.g. "N3bula-G@laxy-99!").
      4. DO NOT use obvious words without heavy modification.
      5. Output ONLY the password string.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt || "Generate a strong, random secure password.",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9, 
        maxOutputTokens: 50,
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty response from AI");
    }
    
    // Remove any potential markdown code blocks if the model hallucinates them
    const cleanText = text.replace(/```/g, '').trim();
    return cleanText;
  } catch (error) {
    console.error("Error generating AI password:", error);
    // Fallback to a random string if AI fails
    return Array(length).fill(0).map(() => Math.random().toString(36).charAt(2)).join('');
  }
};

export const analyzePasswordStrength = async (password: string): Promise<string> => {
   try {
    const modelId = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze the strength of this password: "${password}". 
      Respond with a JSON object containing:
      {
        "score": (number 1-100),
        "feedback": (string, max 1 sentence),
        "timeToCrack": (string, estimated)
      }
      Output only raw JSON.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return response.text?.trim() || "{}";
  } catch (error) {
    console.error("Error analyzing password:", error);
    return "{}";
  }
}
