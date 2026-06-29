export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're offline</h1>
      <p className="text-gray-500 max-w-sm">
        SafeRide QR needs an internet connection to send alerts and notifications.
        Please check your network and try again.
      </p>
    </div>
  );
}
