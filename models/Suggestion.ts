import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

export type ISuggestion = InferSchemaType<typeof suggestionSchema>;

export const Suggestion: Model<ISuggestion> =
  mongoose.models.Suggestion ?? mongoose.model<ISuggestion>("Suggestion", suggestionSchema);
