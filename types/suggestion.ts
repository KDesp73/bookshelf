export const SUGGESTION_STATUSES = [
  "pending",
  "todo",
  "in_progress",
  "done",
  "wont_implement",
] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export interface SuggestionItem {
  _id: string;
  content: string;
  userId?: string;
  userName?: string;
  isAnonymous: boolean;
  status: SuggestionStatus;
  createdAt: string;
}
