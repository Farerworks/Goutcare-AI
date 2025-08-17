export type GroundingChunk = {
  web: {
      uri: string;
      title: string;
  }
};

export type ChatMessage = {
  role: 'user' | 'model';
  content: string;
  sources?: GroundingChunk[];
};

export type SymptomEntry = {
  date: Date;
  painLevel: number;
  summary: string;
};