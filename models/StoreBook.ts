import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const storeBookSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    coverImage: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

storeBookSchema.index({ userId: 1, title: 1 });

export type IStoreBook = InferSchemaType<typeof storeBookSchema>;

export const StoreBook: Model<IStoreBook> =
  mongoose.models.StoreBook ?? mongoose.model<IStoreBook>("StoreBook", storeBookSchema);
