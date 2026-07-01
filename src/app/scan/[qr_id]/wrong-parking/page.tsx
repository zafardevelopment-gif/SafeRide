import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import WrongParkingForm from "./wrong-parking-form";

export const metadata = { title: "Report Wrong Parking" };

export default async function WrongParkingPage({ params }: { params: Promise<{ qr_id: string }> }) {
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

  return (
    <Suspense fallback={null}>
      <WrongParkingForm qrId={qr_id} />
    </Suspense>
  );
}
