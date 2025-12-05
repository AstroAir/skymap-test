import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { TauriSyncProvider } from "@/lib/tauri/TauriSyncProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkyMap",
  description: "Interactive star map application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <TauriSyncProvider>
            {children}
          </TauriSyncProvider>
          <Toaster 
            position="bottom-right" 
            theme="dark"
            richColors
            closeButton
          />
        </I18nProvider>
      </body>
    </html>
  );
}
