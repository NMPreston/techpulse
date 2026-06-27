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
  publishedAt: string;
  commentCount: number;
  tags: string[];
  summary?: string; 
}

export interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  published: string;
  updated: string;
  author: { name: string } | { name: string }[];
  link: { "@_href": string; "@_rel": string; "@_type"?: string }[] | { "@_href": string; "@_rel": string };
  category: { "@_term": string }[] | { "@_term": string };
}