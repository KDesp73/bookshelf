export type StoreDocument = {
  _id: string;
  name: string;
  email: string;
  description?: string;
  address?: string;
  phone?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
};

export type StoreBookDocument = {
  _id: string;
  storeId: string;
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
