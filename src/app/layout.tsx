import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Platform Selection - ETIC",
  description: "Plateforme de gestion et sélection des candidatures - Club ETIC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={montserrat.variable}>
      <body suppressHydrationWarning className={montserrat.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

