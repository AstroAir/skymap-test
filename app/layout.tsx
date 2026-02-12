import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
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
  title: {
    default: "SkyMap - Interactive Star Map & Astronomy Planner",
    template: "%s | SkyMap",
  },
  description:
    "A powerful astronomy application for stargazing, observation planning, and astrophotography. Explore celestial objects with real-time sky rendering powered by Stellarium Web Engine.",
  keywords: [
    "star map",
    "astronomy",
    "stargazing",
    "astrophotography",
    "observation planning",
    "stellarium",
    "celestial",
    "telescope",
    "night sky",
  ],
  authors: [{ name: "AstroAir" }],
  creator: "AstroAir",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SkyMap",
    title: "SkyMap - Interactive Star Map & Astronomy Planner",
    description:
      "A powerful astronomy application for stargazing, observation planning, and astrophotography. Powered by Stellarium Web Engine.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkyMap - Interactive Star Map & Astronomy Planner",
    description:
      "Explore the universe with real-time sky rendering, observation planning, and astrophotography tools.",
  },
  applicationName: "SkyMap",
  category: "Science & Education",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <TauriSyncProvider>
              {children}
            </TauriSyncProvider>
            <Toaster 
              position="bottom-right" 
              richColors
              closeButton
            />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
