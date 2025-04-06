import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Escola Piaget - Portal",
  description: "Sistema de chamados e portal da Escola Piaget",
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
