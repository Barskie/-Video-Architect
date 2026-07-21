import { GoogleGenAI, Type } from "@google/genai";
import { AssetSegment, VideoBlueprint } from "../types";

const MODEL = "gemini-3.1-pro-preview";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const SEARCH_LINK_KEYS = ["youtube", "tiktok", "giphy", "movieClips", "pexels"] as const;

function isAssetSegment(value: unknown): value is AssetSegment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const seg = value as AssetSegment;
  return (
    typeof seg.timestamp === "string" &&
    typeof seg.segment === "string" &&
    typeof seg.visualConcept === "string" &&
    typeof seg.primarySubject === "string" &&
    Array.isArray(seg.stockQuery) &&
    seg.stockQuery.every((q) => typeof q === "string") &&
    typeof seg.memeReference === "string" &&
    typeof seg.veoPrompt === "string" &&
    typeof seg.audioVibe === "string" &&
    !!seg.searchLinks &&
    typeof seg.searchLinks === "object" &&
    SEARCH_LINK_KEYS.every((key) => typeof seg.searchLinks[key] === "string")
  );
}

function isVideoBlueprint(value: unknown): value is VideoBlueprint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as VideoBlueprint;
  return (
    typeof data.title === "string" &&
    typeof data.overallTone === "string" &&
    Array.isArray(data.segments) &&
    data.segments.length > 0 &&
    data.segments.every(isAssetSegment)
  );
}

export async function analyzeScript(script: string): Promise<VideoBlueprint> {
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Add it to your .env.local file.");
  }

  const response = await ai.models.generateContent({
    model: MODEL,
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

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Gemini returned invalid JSON. Please try again.");
  }

  if (!isVideoBlueprint(parsed)) {
    console.error("Gemini response shape did not match VideoBlueprint", parsed);
    throw new Error("Gemini returned an incomplete blueprint. Please try again.");
  }

  return parsed;
}
