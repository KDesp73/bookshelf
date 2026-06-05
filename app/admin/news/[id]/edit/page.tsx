import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPostForm } from "@/components/admin/admin-post-form";
import { getPostById } from "@/lib/blog/queries";

interface AdminEditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditPostPage({ params }: AdminEditPostPageProps) {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <>
      <AdminNav current="news" />
      <AdminPostForm post={post} />
    </>
  );
}
