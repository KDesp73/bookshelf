import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const blogPostSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    excerpt: { type: String, trim: true, maxlength: 400 },
    body: { type: String, required: true, maxlength: 100_000 },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, trim: true },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

blogPostSchema.index({ published: 1, publishedAt: -1 });

export type IBlogPost = InferSchemaType<typeof blogPostSchema>;

export const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost ?? mongoose.model<IBlogPost>("BlogPost", blogPostSchema);
