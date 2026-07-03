import { getAgentsForSelect } from "@/actions/qr-batch";
import ScanAssignForm from "./scan-assign-form";

export const metadata = { title: "Scan & Assign to Agent" };

export default async function ScanAssignPage() {
  const agents = await getAgentsForSelect();
  return <ScanAssignForm agents={agents} />;
}
