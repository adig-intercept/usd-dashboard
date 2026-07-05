import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global USD Exchange Rate Barometer",
  description: "Daily ECB reference-rate monitoring dashboard for USD exchange rates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg font-sans antialiased">{children}</body>
    </html>
  );
}
