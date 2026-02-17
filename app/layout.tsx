import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionSync } from "@/components/auth/session-sync";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Proof - Where Execution Speaks",
  description: "Plataforma AI-Native para transformar proyectos de grado en startups funcionales. ¡Desata tu emprendedor interior con Lola!",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionSync />
        {children}
      </body>
    </html>
  );
}
