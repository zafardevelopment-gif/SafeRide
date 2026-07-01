import { notFound } from "next/navigation";
import { getVehicle } from "@/actions/vehicle";
import EditVehicleForm from "./edit-form";

export const metadata = { title: "Edit Vehicle" };

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  return <EditVehicleForm vehicle={vehicle} />;
}
