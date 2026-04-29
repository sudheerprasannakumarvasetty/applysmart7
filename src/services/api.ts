import { GoogleGenAI, Type } from "@google/genai";
import { JDAnalysis, OptimizationResult, DefendabilityCheck } from "../types";

// Always use process.env.GEMINI_API_KEY for the Gemini API.
const geminiApiKey = process.env.GEMINI_API_KEY;

// Initialize the Gemini API client
const ai = (geminiApiKey && geminiApiKey !== "undefined") ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

/**
 * Helper to clean and parse JSON from Gemini response.
 */
function safeParseJson(text: string | undefined): any {
  if (!text) throw new Error("Empty response from AI. This usually means the API key is missing or invalid in your environment (e.g. Vercel).");
  
  try {
    // Remove potential markdown wrappers
    const cleanedText = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", text);
    throw new Error("AI returned invalid JSON format. Try again.");
  }
}

export const aiService = {
  async analyze(jd: string, resume: string): Promise<JDAnalysis> {
    if (!ai) throw new Error("Gemini API Key not configured. If you are on Vercel, please add GEMINI_API_KEY to your Project Environment Variables.");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this job description and resume. Detect technical skills, responsibilities, and tools.
          
          Job Description:
          ${jd}
          
          Resume:
          ${resume}
          
          Return a JSON object with:
          {
            "match_score": number,
            "matched_skills": string[],
            "missing_skills": string[],
            "decision": "APPLY" | "MAYBE" | "SKIP",
            "responsibilities": string[],
            "tools": string[]
          }
          
          Decision criteria:
          - APPLY: Match Score > 75%
          - MAYBE: Match Score 60-75%
          - SKIP: Match Score < 60%`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              match_score: { type: Type.NUMBER },
              matched_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              missing_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              decision: { type: Type.STRING, enum: ["APPLY", "MAYBE", "SKIP"] },
              responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
              tools: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["match_score", "matched_skills", "missing_skills", "decision", "responsibilities", "tools"],
          },
        },
      });

      return safeParseJson(response.text);
    } catch (error: any) {
      console.error("Gemini Analyze Error:", error);
      throw error;
    }
  },

  async optimize(jd: string, resume: string): Promise<OptimizationResult> {
    if (!ai) throw new Error("Gemini API Key not configured. If you are on Vercel, please add GEMINI_API_KEY to your Project Environment Variables.");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Optimize this resume for the following job description.
          JD: ${jd}
          Resume: ${resume}
          
          Requirements:
          1. Preserve LaTeX structure strictly if input is LaTeX.
          2. Improve bullet points using: action + task + impact.
          3. Inject relevant keywords naturally.
          4. DO NOT add fake experience.
          
          Return a JSON object with:
          {
            "optimized_resume": string,
            "changes_made": string[]
          }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              optimized_resume: { type: Type.STRING },
              changes_made: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["optimized_resume", "changes_made"],
          },
        },
      });

      return safeParseJson(response.text);
    } catch (error: any) {
      console.error("Gemini Optimize Error:", error);
      throw error;
    }
  },

  async checkDefendability(resume: string): Promise<DefendabilityCheck> {
    if (!ai) throw new Error("Gemini API Key not configured. If you are on Vercel, please add GEMINI_API_KEY to your Project Environment Variables.");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Audit this resume for interview defendability. Identify claims that sound exaggerated or lack evidence.
          Resume: ${resume}
          
          Return a JSON object with:
          {
            "warnings": string[],
            "risky_claims": [
              { "claim": "string", "reason": "string" }
            ]
          }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
              risky_claims: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    claim: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ["claim", "reason"],
                },
              },
            },
            required: ["warnings", "risky_claims"],
          },
        },
      });

      return safeParseJson(response.text);
    } catch (error: any) {
      console.error("Gemini Defendability Error:", error);
      throw error;
    }
  },
};
