import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const loginChallengeSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    codeHash: { type: String, required: true },
    callbackUrl: { type: String, required: true, trim: true },
    loginTokenHash: { type: String, index: true },
    loginTokenExpiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date },
  },
  {
    versionKey: false,
  },
);

loginChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type ILoginChallenge = InferSchemaType<typeof loginChallengeSchema>;

export const LoginChallenge: Model<ILoginChallenge> =
  mongoose.models.LoginChallenge ??
  mongoose.model<ILoginChallenge>("LoginChallenge", loginChallengeSchema);
