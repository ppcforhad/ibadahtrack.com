import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "ইবাদাত ট্র্যাকার · Ibadah Tracker",
  description: "নামাজ, যিকির, দুআ ও কুরআন ট্র্যাকিং — সহজ দৈনিক ইবাদাত সঙ্গী",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Ibadah Tracker", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <main className="mx-auto w-full max-w-lg px-4 pb-28 pt-4">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
