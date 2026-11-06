import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const readingChallengeSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  },
);

readingChallengeSchema.index({ userId: 1, year: 1 }, { unique: true });

export type IReadingChallenge = InferSchemaType<typeof readingChallengeSchema>;

export const ReadingChallenge: Model<IReadingChallenge> =
  mongoose.models.ReadingChallenge ??
  mongoose.model<IReadingChallenge>("ReadingChallenge", readingChallengeSchema);
