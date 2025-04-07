import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "2Clicks - Portal",
  description: "Sistema de chamados e portal da 2Clicks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
