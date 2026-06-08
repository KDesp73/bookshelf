import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const userAchievementSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    achievementId: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export type IUserAchievement = InferSchemaType<typeof userAchievementSchema>;

export const UserAchievement: Model<IUserAchievement> =
  mongoose.models.UserAchievement ??
  mongoose.model<IUserAchievement>("UserAchievement", userAchievementSchema);
