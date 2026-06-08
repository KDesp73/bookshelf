import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPostForm } from "@/components/admin/admin-post-form";
import { getPostById } from "@/lib/blog/queries";
import { getSessionUser } from "@/lib/auth/get-session-user";
import { isAdminEmail } from "@/lib/auth/admin";
import { ADMIN_PERMISSIONS } from "@/lib/constants";

interface AdminEditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditPostPage({ params }: AdminEditPostPageProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  const user = await getSessionUser();
  const canSendPromotional =
    !!user && (isAdminEmail(user.email) || user.adminPermissions.includes(ADMIN_PERMISSIONS.MANAGE_EMAILS));

  return (
    <>
      <AdminNav current="news" />
      <AdminPostForm post={post} canSendPromotional={canSendPromotional} />
    </>
  );
}
