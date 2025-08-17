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

export type GoutForecastDay = {
  day: string;
  weather: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
  goutIndex: 'Good' | 'Moderate' | 'Caution' | 'High Risk';
  goutIndexNumeric: number;
  explanation: string;
};

export type GoutForecast = {
  forecast: GoutForecastDay[];
};