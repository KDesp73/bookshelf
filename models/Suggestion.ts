import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const SUGGESTION_STATUSES = [
  "pending",
  "todo",
  "in_progress",
  "done",
  "wont_implement",
] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

const suggestionSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: SUGGESTION_STATUSES,
      default: "pending",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false,
  },
);

export type ISuggestion = InferSchemaType<typeof suggestionSchema>;

export const Suggestion: Model<ISuggestion> =
  mongoose.models.Suggestion ?? mongoose.model<ISuggestion>("Suggestion", suggestionSchema);
