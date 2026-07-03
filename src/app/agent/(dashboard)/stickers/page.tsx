import { getMyQRCodes } from "@/actions/agent";
import StickersList from "./stickers-list";

export const metadata = { title: "Stickers Sold" };

export default async function AgentStickersPage() {
  const codes = await getMyQRCodes();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Stickers Sold</h1>
      <StickersList codes={codes} />
    </div>
  );
}
