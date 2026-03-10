import { GoogleGenAI, Type } from "@google/genai";
import { VideoBlueprint } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeScript(script: string): Promise<VideoBlueprint> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Act as a High-Speed Video Production Architect. 
    Your goal is to create a production blueprint that allows for rapid editing and maximum viewer retention.
    
    CORE RULES:
    1. SEGMENTATION: Break the script into tight 2-4 second segments (Visual Swap Logic).
    2. THE HOOK: The first 3 seconds MUST be a high-impact "Hook Moment".
    3. SEARCH LINKS: Generate clickable links for:
       - YouTube (4K): General high-quality footage.
       - Movie Clips: Specific scenes from films/series.
       - TikTok: Viral memes and trending clips.
       - Giphy: Reaction GIFs.
       - Pexels: Clean stock B-roll.
    4. AUDIO: Identify specific viral sound bites or trending audio for March 2026.
    5. AI PROMPTS: Technical Veo 3.1 prompts for custom gap-filling.
    
    SCRIPT:
    ${script}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          overallTone: { type: Type.STRING },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                segment: { type: Type.STRING },
                visualConcept: { type: Type.STRING },
                primarySubject: { type: Type.STRING },
                stockQuery: { type: Type.ARRAY, items: { type: Type.STRING } },
                memeReference: { type: Type.STRING },
                veoPrompt: { type: Type.STRING },
                audioVibe: { type: Type.STRING, description: "Viral sound bite or trending audio name" },
                searchLinks: {
                  type: Type.OBJECT,
                  properties: {
                    youtube: { type: Type.STRING },
                    tiktok: { type: Type.STRING },
                    giphy: { type: Type.STRING },
                    movieClips: { type: Type.STRING },
                    pexels: { type: Type.STRING }
                  }
                }
              },
              required: ["timestamp", "segment", "visualConcept", "primarySubject", "stockQuery", "memeReference", "veoPrompt", "audioVibe", "searchLinks"]
            }
          }
        },
        required: ["title", "overallTone", "segments"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as VideoBlueprint;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze script");
  }
}
