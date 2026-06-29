export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 text-center">
        <span className="text-2xl font-bold text-blue-600">SafeRide QR</span>
        <p className="text-sm text-gray-500 mt-1">Smart Vehicle Protection</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
