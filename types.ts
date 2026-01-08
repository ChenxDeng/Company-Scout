export interface RadarScore {
  subject: string;
  value: number;
}

export interface CompanyInfo {
  name: string;
  isFortune500: string;
  benefitsAndCareer: string;
  historyAndFuture: string;
  latestNews: string;
  scores: RadarScore[];
  scoreExplanations: Record<string, string>;
  sources: Array<{ title: string; uri: string }>;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}