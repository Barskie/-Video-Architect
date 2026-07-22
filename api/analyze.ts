import { GoogleGenAI, Type } from "@google/genai";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { VideoBlueprint } from "../src/types";

type AnalyzeRequest = IncomingMessage & { body?: { script?: unknown } | string };
type ApiResponse = ServerResponse & {
  status(code: number): ApiResponse;
  json(body: unknown): void;
};

function isVideoBlueprint(value: unknown): value is VideoBlueprint {
  if (!value || typeof value !== "object") return false;
  const data = value as VideoBlueprint;
  return typeof data.title === "string" && typeof data.overallTone === "string" && Array.isArray(data.segments);
}

function getScript(req: AnalyzeRequest): string {
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  return typeof body?.script === "string" ? body.script.trim() : "";
}

export default async function handler(req: AnalyzeRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "The AI service is not configured. Add GEMINI_API_KEY in Vercel." });
  }

  let script: string;
  try {
    script = getScript(req);
  } catch {
    return res.status(400).json({ error: "Invalid JSON request body." });
  }
  if (!script) return res.status(400).json({ error: "A script is required." });
  if (script.length > 20_000) return res.status(413).json({ error: "The script is too long." });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Act as a High-Speed Video Production Architect.
Create a rapid-editing production blueprint with maximum viewer retention.

CORE RULES:
1. Break the script into tight 2-4 second segments.
2. Make the first 3 seconds a high-impact hook.
3. Generate search links for YouTube (4K), movie clips, TikTok, Giphy, and Pexels.
4. Identify current viral sound bites or trending audio.
5. Create technical Veo 3.1 prompts for custom gap-filling.

SCRIPT:
${script}`,
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
                  timestamp: { type: Type.STRING }, segment: { type: Type.STRING },
                  visualConcept: { type: Type.STRING }, primarySubject: { type: Type.STRING },
                  stockQuery: { type: Type.ARRAY, items: { type: Type.STRING } },
                  memeReference: { type: Type.STRING }, veoPrompt: { type: Type.STRING },
                  audioVibe: { type: Type.STRING },
                  searchLinks: {
                    type: Type.OBJECT,
                    properties: {
                      youtube: { type: Type.STRING }, tiktok: { type: Type.STRING },
                      giphy: { type: Type.STRING }, movieClips: { type: Type.STRING },
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

    const blueprint: unknown = JSON.parse(response.text || "{}");
    if (!isVideoBlueprint(blueprint)) throw new Error("Unexpected Gemini response shape.");
    return res.status(200).json({ blueprint });
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return res.status(502).json({ error: "The AI analysis failed. Please try again." });
  }
}