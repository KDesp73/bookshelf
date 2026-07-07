import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { AVATAR_TYPES, MAX_FAVORITE_BOOKS, ALL_ADMIN_PERMISSIONS } from "@/lib/constants";
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
    wishlistPublic: { type: Boolean, default: false },
    promotionalEmailsOptIn: { type: Boolean, default: false },
    favoriteBookIds: {
      type: [String],
      default: [],
      validate: {
        validator: (ids: string[]) => ids.length <= MAX_FAVORITE_BOOKS,
        message: `Maximum ${MAX_FAVORITE_BOOKS} favorite books allowed.`,
      },
    },
    isAdmin: { type: Boolean, default: false, index: true },
    adminPermissions: {
      type: [String],
      default: ALL_ADMIN_PERMISSIONS,
      enum: ALL_ADMIN_PERMISSIONS,
    },
    passwordHash: { type: String, select: false },
    isStore: { type: Boolean, default: false, index: true },
    storeName: { type: String, trim: true, maxlength: 200 },
    storeDescription: { type: String, trim: true, maxlength: 1000 },
    storeAddress: { type: String, trim: true },
    storePhone: { type: String, trim: true },
    storeLogo: { type: String, trim: true },
    storePostalCode: { type: String, trim: true },
    storeCity: { type: String, trim: true },
    storeImages: { type: [String], default: [] },
    storeWebsite: { type: String, trim: true },
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
