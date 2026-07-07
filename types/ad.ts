export type AdDocument = {
  _id: string;
  userId: string;
  title: string;
  text: string;
  image?: string;
  link?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type AdInput = {
  title: string;
  text: string;
  image?: string;
  link?: string;
};

export type AdActionState = {
  error?: string;
  success?: boolean;
};
