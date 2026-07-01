import { notFound } from "next/navigation";
import { getUserDetail } from "@/actions/admin-users";
import UserDetailPanel from "./user-detail-panel";

export const metadata = { title: "User Detail" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserDetail(id);
  if (!user) notFound();

  return <UserDetailPanel user={user} />;
}
