export type OAuthProviderId = "google" | "github";

export function getEnabledOAuthProviders(): OAuthProviderId[] {
  const providers: OAuthProviderId[] = [];

  if (process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim()) {
    providers.push("google");
  }

  if (process.env.AUTH_GITHUB_ID?.trim() && process.env.AUTH_GITHUB_SECRET?.trim()) {
    providers.push("github");
  }

  return providers;
}

export function hasOAuthProviders(): boolean {
  return getEnabledOAuthProviders().length > 0;
}
