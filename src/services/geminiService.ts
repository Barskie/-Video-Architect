import type { AnalysisResult } from "../types";

const REQUEST_TIMEOUT_MS = 58_000;

export async function analyzeScript(script: string, includeTrends = false): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, includeTrends }),
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The analysis timed out. Try a shorter script.");
    }
    throw new Error("Could not reach the analysis service. Please try again.");
  } finally {
    window.clearTimeout(timeout);
  }

  const data = (await response.json().catch(() => null)) as
    | (Partial<AnalysisResult> & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(data?.error || "Failed to analyze script. Please try again.");
  }
  if (!data?.blueprint || !data.usage) {
    throw new Error("The analysis service returned an invalid response.");
  }
  return { blueprint: data.blueprint, usage: data.usage };
}
