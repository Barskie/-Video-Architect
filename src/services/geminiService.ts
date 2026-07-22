import { VideoBlueprint } from "../types";

export async function analyzeScript(script: string): Promise<VideoBlueprint> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script }),
  });

  const data = (await response.json().catch(() => null)) as
    | { blueprint?: VideoBlueprint; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(data?.error || "Failed to analyze script. Please try again.");
  }
  if (!data?.blueprint) {
    throw new Error("The analysis service returned an invalid response.");
  }
  return data.blueprint;
}