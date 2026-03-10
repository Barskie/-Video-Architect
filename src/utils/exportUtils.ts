import { VideoBlueprint } from "../types";

export function generateEDL(blueprint: VideoBlueprint): string {
  let edl = `TITLE: ${blueprint.title}\nFCM: NON-DROP FRAME\n\n`;
  
  blueprint.segments.forEach((seg, index) => {
    const nextSeg = blueprint.segments[index + 1];
    const startTime = seg.timestamp.replace(/:/g, ":"); // Simplified
    const endTime = nextSeg ? nextSeg.timestamp : "00:00:10:00"; // Placeholder end
    
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
    const start = index * 72; // Assuming ~3 seconds per segment at 24fps
    const end = (index + 1) * 72;
    
    xml += `
          <clipitem id="clip-${index}">
            <name>${seg.primarySubject.substring(0, 20)}</name>
            <start>${start}</start>
            <end>${end}</end>
            <in>0</in>
            <out>72</out>
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
