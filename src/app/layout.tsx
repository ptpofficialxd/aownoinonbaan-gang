import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "เอาน้อยนอนบ้าน",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full max-w-full overflow-x-hidden antialiased`}
    >
      <body className="min-h-full w-full max-w-full overflow-x-hidden">
        <div className="flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-hidden">
          <Header />
          <main className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden pt-16">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
