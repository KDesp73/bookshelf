import "server-only";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export interface PromotionalRecipient {
  email: string;
  name?: string;
}

export async function countPromotionalRecipients(): Promise<number> {
  await connectDB();
  return User.countDocuments({ promotionalEmailsOptIn: true });
}

export async function listPromotionalRecipients(): Promise<PromotionalRecipient[]> {
  await connectDB();
  const users = await User.find({ promotionalEmailsOptIn: true })
    .select("email name")
    .sort({ email: 1 })
    .lean();

  return users.map((user) => ({
    email: user.email,
    name: user.name ?? undefined,
  }));
}
