import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { BLOG_REACTION_EMOJIS } from "@/lib/constants";

const blogReactionSchema = new Schema(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    emoji: {
      type: String,
      required: true,
      enum: BLOG_REACTION_EMOJIS,
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

blogReactionSchema.index({ postId: 1, userId: 1, emoji: 1 }, { unique: true });
blogReactionSchema.index({ postId: 1, emoji: 1 });

export type IBlogReaction = InferSchemaType<typeof blogReactionSchema>;

export const BlogReaction: Model<IBlogReaction> =
  mongoose.models.BlogReaction ??
  mongoose.model<IBlogReaction>("BlogReaction", blogReactionSchema);
