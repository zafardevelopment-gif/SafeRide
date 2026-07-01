import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmergencyForm from "./emergency-form";

export const metadata = { title: "Emergency" };

export default async function EmergencyPage({ params }: { params: Promise<{ qr_id: string }> }) {
  const { qr_id } = await params;
  const supabase = await createClient();

  const { data: qrCode } = await supabase
    .from("ss_qr_codes")
    .select("status")
    .eq("qr_id", qr_id)
    .maybeSingle();

  if (!qrCode || qrCode.status !== "active") {
    redirect(`/scan/${qr_id}`);
  }

  return <EmergencyForm qrId={qr_id} />;
}
