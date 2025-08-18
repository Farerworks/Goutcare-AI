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
  image?: {
    mimeType: string;
    data: string;
  }
};

export type SymptomEntry = {
  date: Date;
  painLevel: number;
  painLocation: string;
  summary: string;
};

export type MedicationEntry = {
    date: Date;
    timeOfDay: 'Morning' | 'Lunch' | 'Dinner' | 'Bedtime';
    medicationName: string;
    summary: string;
};

export type DietEntry = {
    date: Date;
    timeOfDay: 'Breakfast' | 'Lunch' | 'Dinner' | 'After Dinner';
    foodDescription: string;
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
  locationName: string;
  forecast: GoutForecastDay[];
  personalizedAlert?: string;
};