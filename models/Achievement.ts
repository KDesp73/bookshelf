import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ACHIEVEMENT_CONDITION_TYPES } from "@/lib/constants";

const achievementSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    badge: { type: String, trim: true },
    conditionType: {
      type: String,
      required: true,
      enum: ACHIEVEMENT_CONDITION_TYPES,
    },
    conditionValue: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true }, versionKey: false },
);

achievementSchema.index({ conditionType: 1, conditionValue: 1 });
achievementSchema.index({ createdAt: -1 });

export type IAchievement = InferSchemaType<typeof achievementSchema>;

export const Achievement: Model<IAchievement> =
  mongoose.models.Achievement ??
  mongoose.model<IAchievement>("Achievement", achievementSchema);
