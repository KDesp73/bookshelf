import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const passwordResetTokenSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date },
  },
  {
    versionKey: false,
  },
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type IPasswordResetToken = InferSchemaType<typeof passwordResetTokenSchema>;

export const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken ??
  mongoose.model<IPasswordResetToken>("PasswordResetToken", passwordResetTokenSchema);
