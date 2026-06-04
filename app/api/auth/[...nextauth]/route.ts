import { handlers } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export const { GET, POST } = handlers;
