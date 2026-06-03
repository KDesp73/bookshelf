import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { AVATAR_TYPES } from "@/lib/constants";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, trim: true },
    image: { type: String, trim: true },
    avatarType: {
      type: String,
      enum: AVATAR_TYPES,
      default: "identicon",
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9_-]{3,30}$/,
    },
    bio: { type: String, trim: true, maxlength: 280 },
    isAdmin: { type: Boolean, default: false, index: true },
    passwordHash: { type: String, select: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

userSchema.index({ username: 1 });

export type IUser = InferSchemaType<typeof userSchema>;

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
