import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const collectionLikeSchema = new Schema(
  {
    likerId: { type: String, required: true, index: true },
    targetUserId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

collectionLikeSchema.index({ likerId: 1, targetUserId: 1 }, { unique: true });
collectionLikeSchema.index({ targetUserId: 1, createdAt: -1 });

export type ICollectionLike = InferSchemaType<typeof collectionLikeSchema>;

export const CollectionLike: Model<ICollectionLike> =
  mongoose.models.CollectionLike ??
  mongoose.model<ICollectionLike>("CollectionLike", collectionLikeSchema);
