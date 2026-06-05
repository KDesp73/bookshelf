import { AdminNav } from "@/components/admin/admin-nav";
import { AdminPostForm } from "@/components/admin/admin-post-form";

export default function AdminNewPostPage() {
  return (
    <>
      <AdminNav current="news" />
      <AdminPostForm />
    </>
  );
}
