import type { VideoBlueprint } from "../types";

const FPS = 24;
const FALLBACK_SEGMENT_SECONDS = 3;

function singleLine(value: string, maxLength: number): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, maxLength);
}

function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function safeExportFileName(value: string, extension: "edl" | "xml"): string {
  const base = value
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 100);
  return `${base || "video_blueprint"}.${extension}`;
}

function parseTimestampToFrames(timestamp: string): number {
  const parts = timestamp.trim().split(":").map(Number);
  if (parts.some((value) => !Number.isInteger(value) || value < 0)) {
    return 0;
  }

  if (parts.length === 4) {
    const [hh, mm, ss, ff] = parts;
    if (mm > 59 || ss > 59 || ff >= FPS) return 0;
    return (((hh * 60 + mm) * 60 + ss) * FPS) + ff;
  }

  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    if (mm > 59 || ss > 59) return 0;
    return (((hh * 60 + mm) * 60 + ss) * FPS);
  }

  if (parts.length === 2) {
    const [mm, ss] = parts;
    if (ss > 59) return 0;
    return ((mm * 60 + ss) * FPS);
  }

  return 0;
}

function framesToTimecode(frames: number): string {
  const safeFrames = Math.max(0, Math.floor(frames));
  const hh = Math.floor(safeFrames / (FPS * 3600));
  const mm = Math.floor((safeFrames % (FPS * 3600)) / (FPS * 60));
  const ss = Math.floor((safeFrames % (FPS * 60)) / FPS);
  const ff = safeFrames % FPS;
  return [hh, mm, ss, ff].map((value) => value.toString().padStart(2, "0")).join(":");
}

function getSegmentRange(blueprint: VideoBlueprint, index: number): { start: number; end: number } {
  const start = parseTimestampToFrames(blueprint.segments[index].timestamp);
  const nextTimestamp = blueprint.segments[index + 1]?.timestamp;

  if (nextTimestamp) {
    const parsedNext = parseTimestampToFrames(nextTimestamp);
    if (parsedNext > start) {
      return { start, end: parsedNext };
    }
  }

  return { start, end: start + (FALLBACK_SEGMENT_SECONDS * FPS) };
}

export function generateEDL(blueprint: VideoBlueprint): string {
  let edl = `TITLE: ${singleLine(blueprint.title, 100)}\nFCM: NON-DROP FRAME\n\n`;
  
  blueprint.segments.forEach((seg, index) => {
    const { start, end } = getSegmentRange(blueprint, index);
    const startTime = framesToTimecode(start);
    const endTime = framesToTimecode(end);
    
    const clipNum = (index + 1).toString().padStart(3, "0");
    edl += `${clipNum}  AX       V     C        ${startTime} ${endTime} ${startTime} ${endTime}\n`;
    edl += `* FROM CLIP NAME: ${singleLine(seg.primarySubject, 30)}\n`;
    edl += `* COMMENT: ${singleLine(seg.visualConcept, 50)}\n\n`;
  });
  
  return edl;
}

export function generateXML(blueprint: VideoBlueprint): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="5">
  <sequence>
    <name>${escapeXml(singleLine(blueprint.title, 100))}</name>
    <rate>
      <timebase>24</timebase>
    </rate>
    <media>
      <video>
        <track>`;

  blueprint.segments.forEach((seg, index) => {
    const { start, end } = getSegmentRange(blueprint, index);
    
    xml += `
          <clipitem id="clip-${index}">
            <name>${escapeXml(singleLine(seg.primarySubject, 20))}</name>
            <start>${start}</start>
            <end>${end}</end>
            <in>0</in>
            <out>${Math.max(FPS, end - start)}</out>
          </clipitem>`;
  });

  xml += `
        </track>
      </video>
    </media>
  </sequence>
</xmeml>`;
  
  return xml;
}

export function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = fileName;
  a.hidden = true;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
