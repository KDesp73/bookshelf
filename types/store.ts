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

export type StoreBookInput = {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price: number;
  coverImage?: string;
  quantity?: number;
};
