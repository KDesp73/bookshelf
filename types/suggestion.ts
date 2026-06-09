import type { SuggestionStatus } from "@/models/Suggestion";

export interface SuggestionItem {
  _id: string;
  content: string;
  userId?: string;
  userName?: string;
  isAnonymous: boolean;
  status: SuggestionStatus;
  createdAt: string;
}
