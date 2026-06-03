import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { AVATAR_TYPES } from "@/lib/constants";
import { SHELF_PRESETS } from "@/types/shelf";

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
    shelfPreset: {
      type: String,
      enum: SHELF_PRESETS,
      default: "default",
    },
    shelfAccent: { type: String, trim: true, maxlength: 7 },
    shelfBackground: { type: String, trim: true, maxlength: 7 },
    shelfCustomCss: { type: String, maxlength: 12000 },
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
