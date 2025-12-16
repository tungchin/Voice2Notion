export enum Category {
  WORK = 'Work',
  PERSONAL = 'Personal',
  IDEAS = 'Ideas',
  TODO = 'To-Do',
  OTHER = 'Other'
}

export interface VoiceNote {
  id: string;
  createdAt: number;
  transcription: string;
  category: Category;
  summary: string;
  tags: string[];
  audioUrl?: string; // Optional URL if we stored the blob locally
  syncedToNotion: boolean;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
  corsProxy?: string;
}

export interface ProcessingResult {
  transcription: string;
  category: Category;
  summary: string;
  tags: string[];
}