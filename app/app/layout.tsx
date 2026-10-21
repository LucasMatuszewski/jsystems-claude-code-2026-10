import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { texts } from "@/lib/case/texts";

import "./globals.css";

const instrumentSans = localFont({
  display: "swap",
  src: "./fonts/InstrumentSans-Variable.woff2",
  style: "normal",
  variable: "--font-instrument-sans",
  weight: "400 700",
});

export const metadata: Metadata = {
  description: "Asystent decyzji serwisowych dla zwrotów i reklamacji sprzętu",
  title: texts.app.productName,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={instrumentSans.variable} lang="pl">
      <body className="font-sans antialiased">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
