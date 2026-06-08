import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPostForm } from "@/components/admin/admin-post-form";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { isAdminEmail } from "@/lib/auth/admin";
import { ADMIN_PERMISSIONS } from "@/lib/constants";

export default async function AdminNewPostPage() {
  const user = await getSessionUser();
  const canSendPromotional =
    !!user && (isAdminEmail(user.email) || user.adminPermissions.includes(ADMIN_PERMISSIONS.MANAGE_EMAILS));

  return (
    <>
      <AdminNav current="news" />
      <AdminPostForm canSendPromotional={canSendPromotional} />
    </>
  );
}
