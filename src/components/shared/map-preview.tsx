const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MapPreview({ lat, lng }: { lat: number; lng: number }) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const src = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=16`;

  return (
    <iframe
      title="Scan location"
      src={src}
      className="w-full h-40 rounded-lg border border-border"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
