import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Uploads to the public "scan-photos" bucket (anon insert allowed — see
// supabase/migrations/009_scan_photos_storage.sql) and returns its public URL.
export async function uploadScanPhoto(file: File, qrId: string): Promise<string | null> {
  if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE_BYTES) {
    return null;
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${qrId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("scan-photos").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return null;

  const { data } = supabase.storage.from("scan-photos").getPublicUrl(path);
  return data.publicUrl;
}
