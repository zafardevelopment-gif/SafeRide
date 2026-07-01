import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { faqs } from "@/lib/faq-data";
import ChatWidget from "@/components/faq/chat-widget";

export const metadata = { title: "FAQ — SafeRide QR" };

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-blue-600 text-lg tracking-tight">
            SafeRide QR
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>

        <div className="space-y-3">
          {faqs.map((item) => (
            <Card key={item.q}>
              <CardContent className="py-4">
                <h2 className="font-semibold text-gray-900 mb-1.5">{item.q}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Still have questions?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline font-medium">
            Contact us
          </Link>
          .
        </p>
      </div>

      <ChatWidget />
    </main>
  );
}
