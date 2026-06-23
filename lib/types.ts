export interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number; // Unix timestamp
  descendants?: number; // comment count
  type: string;
}

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  score: number;
  author: string;
  publishedAt: string; // ISO date string
  commentCount: number;
  tags: string[];
}