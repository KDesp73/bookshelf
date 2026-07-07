import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { getUserSettings } from "@/lib/users/settings";
import { logoutAction } from "@/actions/auth";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PromotionalEmailsToggle } from "@/components/settings/promotional-emails-toggle";
import { SettingsSection } from "@/components/settings/settings-section";
import { ThemeSettings } from "@/components/settings/theme-settings";
import { ShelfAppearanceForm } from "@/components/shelf/shelf-appearance-form";
import { WishlistVisibilityToggle } from "@/components/wishlist/wishlist-visibility-toggle";
import { Button } from "@/components/ui/button";
import { StoreConvertForm } from "@/components/store/store-convert-form";

export default async function SettingsPage() {
  const viewer = await getSessionUser();

  if (!viewer?.id) {
    redirect("/login?callbackUrl=/settings");
  }

  if (!viewer.username) {
    redirect("/onboarding");
  }

  const settings = await getUserSettings(viewer.id);

  if (!settings?.username) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-amber-950 dark:text-amber-100 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Manage your profile, privacy, and account preferences.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/u/${settings.username}`}>Back to profile</Link>
        </Button>
      </div>

      <SettingsSection
        title="Profile"
        description="How you appear on your public bookshelf."
      >
        <ProfileSettingsForm user={settings} />
      </SettingsSection>

      <SettingsSection
        title="Theme"
        description="Choose light, dark, or match your system setting."
      >
        <ThemeSettings />
      </SettingsSection>

      <SettingsSection
        title="Shelf appearance"
        description="Customize colors and styling for your public profile."
      >
        <ShelfAppearanceForm user={settings} />
      </SettingsSection>

      <SettingsSection
        title="Privacy & email"
        description="Control what others see and how we contact you."
      >
        <WishlistVisibilityToggle wishlistPublic={settings.wishlistPublic} compact />
        <PromotionalEmailsToggle
          promotionalEmailsOptIn={settings.promotionalEmailsOptIn}
        />
      </SettingsSection>

      {settings.hasPassword ? (
        <SettingsSection
          title="Security"
          description="Update the password for your email sign-in."
        >
          <ChangePasswordForm />
        </SettingsSection>
      ) : null}

      <SettingsSection title="Account">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Email
            </p>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {settings.email}
            </p>
          </div>
          <form action={logoutAction}>
            <Button variant="outline" type="submit">
              Log out
            </Button>
          </form>
        </div>
      </SettingsSection>

      <SettingsSection
        title={viewer.isStore ? "Store settings" : "Store account"}
        description={
          viewer.isStore
            ? "Manage your bookstore information."
            : "Convert your account to a store account to list books and run ads."
        }
      >
        <StoreConvertForm user={viewer} />
      </SettingsSection>

      <SettingsSection
        title="Delete account"
        description="Permanently remove your account and all associated data."
      >
        <DeleteAccountForm
          email={settings.email}
          hasPassword={settings.hasPassword}
        />
      </SettingsSection>
    </div>
  );
}
