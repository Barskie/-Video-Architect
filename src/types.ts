export interface AssetSegment {
  timestamp: string;
  segment: string;
  visualConcept: string;
  primarySubject: string;
  stockQuery: string[];
  memeReference: string;
  veoPrompt: string;
  audioVibe: string;
  searchLinks: {
    youtube: string;
    tiktok: string;
    giphy: string;
    movieClips: string;
    pexels: string;
  };
}

export interface VideoBlueprint {
  title: string;
  overallTone: string;
  segments: AssetSegment[];
}
