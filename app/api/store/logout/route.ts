import { NextResponse } from "next/server";
import { destroyStoreSession, getStoreFromSession, clearSessionCookie } from "@/lib/store/auth";
import { getSiteUrl } from "@/lib/site-url";

export async function POST() {
  const store = await getStoreFromSession();
  if (store) {
    await destroyStoreSession(store._id);
  } else {
    await clearSessionCookie();
  }

  return NextResponse.redirect(new URL("/store/login", getSiteUrl()));
}
