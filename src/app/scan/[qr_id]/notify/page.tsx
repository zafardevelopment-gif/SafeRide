import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotifyForm from "./notify-form";

export const metadata = { title: "Notify Owner" };

export default async function NotifyPage({ params }: { params: Promise<{ qr_id: string }> }) {
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

  return <NotifyForm qrId={qr_id} />;
}
