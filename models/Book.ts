import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { RATING_VALUES, READING_STATUSES } from "@/lib/constants";

const bookSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    isbn13: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    authors: { type: [String], default: [] },
    publisher: { type: String, trim: true },
    publishedDate: { type: String, trim: true },
    description: { type: String },
    pageCount: { type: Number },
    coverUrl: { type: String, trim: true },
    genres: { type: [String], default: [] },
    subjects: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    // Not "language" — MongoDB text indexes treat that field as a search-language override.
    langCode: { type: String, trim: true, lowercase: true },
    publishYear: { type: Number },
    openLibraryWorkKey: { type: String, trim: true },
    googleVolumeId: { type: String, trim: true },
    metadataEnrichedAt: { type: Date },
    status: {
      type: String,
      enum: READING_STATUSES,
      default: "Unread",
    },
    tags: { type: [String], default: [] },
    notes: { type: String },
    isPublicNote: { type: Boolean, default: false },
    rating: {
      type: Number,
      enum: RATING_VALUES,
    },
    isWishlist: { type: Boolean, default: false, index: true },
    dateAdded: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

bookSchema.index({ userId: 1, isbn13: 1 }, { unique: true });
bookSchema.index(
  { userId: 1, title: "text", authors: "text" },
  { language_override: "searchLanguage" },
);
bookSchema.index({ userId: 1, genres: 1 });
bookSchema.index({ metadataEnrichedAt: 1 });

export type IBook = InferSchemaType<typeof bookSchema>;

export const Book: Model<IBook> =
  mongoose.models.Book ?? mongoose.model<IBook>("Book", bookSchema);
