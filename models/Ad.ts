import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const adSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    link: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true, versionKey: false },
);

adSchema.index({ userId: 1, status: 1 });

export type IAd = InferSchemaType<typeof adSchema>;

export const Ad: Model<IAd> =
  mongoose.models.Ad ?? mongoose.model<IAd>("Ad", adSchema);
