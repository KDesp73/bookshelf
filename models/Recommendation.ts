import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const recommendationItemSchema = new Schema(
  {
    title: { type: String, required: true },
    authors: { type: [String], default: [] },
    coverUrl: String,
    description: String,
    isbn13: String,
    source: {
      type: String,
      enum: ["community"],
      required: true,
    },
    reason: { type: String, required: true },
    fromUserId: String,
    fromUsername: String,
    fromUserDisplayName: String,
  },
  { _id: false },
);

const recommendationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    items: { type: [recommendationItemSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

recommendationSchema.index({ userId: 1, date: 1 }, { unique: true });

export type IRecommendation = InferSchemaType<typeof recommendationSchema>;

export const RecommendationModel: Model<IRecommendation> =
  mongoose.models.Recommendation ??
  mongoose.model<IRecommendation>("Recommendation", recommendationSchema);
