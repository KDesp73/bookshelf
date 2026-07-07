import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const storeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    sessionToken: { type: String, select: false },
    description: { type: String, trim: true, maxlength: 1000 },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    logo: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false },
);

storeSchema.index({ sessionToken: 1 });

export type IStore = InferSchemaType<typeof storeSchema>;

export const Store: Model<IStore> =
  mongoose.models.Store ?? mongoose.model<IStore>("Store", storeSchema);
