import "server-only";

export function getAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isAdminEmail(email: string): boolean {
  const adminEmail = getAdminEmail();
  return !!adminEmail && email.trim().toLowerCase() === adminEmail;
}
