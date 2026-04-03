import { VideoBlueprint } from "../types";

const FPS = 24;
const FALLBACK_SEGMENT_SECONDS = 3;

function parseTimestampToFrames(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.some(Number.isNaN)) {
    return 0;
  }

  if (parts.length === 4) {
    const [hh, mm, ss, ff] = parts;
    return (((hh * 60 + mm) * 60 + ss) * FPS) + ff;
  }

  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    return (((hh * 60 + mm) * 60 + ss) * FPS);
  }

  if (parts.length === 2) {
    const [mm, ss] = parts;
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
  let edl = `TITLE: ${blueprint.title}\nFCM: NON-DROP FRAME\n\n`;
  
  blueprint.segments.forEach((seg, index) => {
    const { start, end } = getSegmentRange(blueprint, index);
    const startTime = framesToTimecode(start);
    const endTime = framesToTimecode(end);
    
    const clipNum = (index + 1).toString().padStart(3, "0");
    edl += `${clipNum}  AX       V     C        ${startTime} ${endTime} ${startTime} ${endTime}\n`;
    edl += `* FROM CLIP NAME: ${seg.primarySubject.substring(0, 30)}\n`;
    edl += `* COMMENT: ${seg.visualConcept.substring(0, 50)}\n\n`;
  });
  
  return edl;
}

export function generateXML(blueprint: VideoBlueprint): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<xmeml version="5">
  <sequence>
    <name>${blueprint.title}</name>
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
            <name>${seg.primarySubject.substring(0, 20)}</name>
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
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
