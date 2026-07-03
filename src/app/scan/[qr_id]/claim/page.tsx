import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlaceholderStatus } from "@/actions/claim-vehicle";
import ClaimForm from "./claim-form";

export const metadata = { title: "Claim Your Sticker" };

export default async function ClaimPage({ params }: { params: Promise<{ qr_id: string }> }) {
  const { qr_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/scan/${qr_id}/claim`);
  }

  const status = await getPlaceholderStatus(qr_id);
  if (!status) {
    redirect(`/scan/${qr_id}`);
  }
  if (!status.needsClaim) {
    redirect(`/scan/${qr_id}`);
  }

  return <ClaimForm qrId={qr_id} />;
}
