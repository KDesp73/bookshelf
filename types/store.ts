export interface StoreListItem {
  _id: string;
  storeName: string;
  storeDescription?: string;
  storeLogo?: string;
  storeCity?: string;
  storeImages?: string[];
  username: string;
  name?: string;
  storeLatitude?: number;
  storeLongitude?: number;
}

export type StoreBookDocument = {
  _id: string;
  userId: string;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price: number;
  coverImage?: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

export type RelevantStoreBook = StoreBookDocument & {
  storeName: string;
  storeCity?: string;
  storeUsername: string;
  matchReason: "wishlist" | "author";
};

export type StoreBookInput = {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price: number;
  coverImage?: string;
  quantity?: number;
};
