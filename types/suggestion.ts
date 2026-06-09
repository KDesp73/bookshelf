export interface SuggestionItem {
  _id: string;
  content: string;
  userId?: string;
  userName?: string;
  isAnonymous: boolean;
  createdAt: string;
}
