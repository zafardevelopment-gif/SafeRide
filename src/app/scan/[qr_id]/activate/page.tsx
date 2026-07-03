import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ActivateForm from "./activate-form";

export const metadata = { title: "Activate Your Sticker" };

export default async function ActivatePage({ params }: { params: Promise<{ qr_id: string }> }) {
  const { qr_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/scan/${qr_id}/activate`);
  }

  const { data: qrCode } = await supabase
    .from("ss_qr_codes")
    .select("id, status")
    .eq("qr_id", qr_id)
    .maybeSingle();

  if (!qrCode) {
    redirect(`/scan/${qr_id}`);
  }
  if (qrCode.status !== "unactivated") {
    redirect(`/scan/${qr_id}`);
  }

  const { data: existingVehicles } = await supabase
    .from("ss_vehicles")
    .select("id, vehicle_number, type, brand, model, color, year")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return <ActivateForm qrId={qr_id} existingVehicles={existingVehicles ?? []} />;
}
