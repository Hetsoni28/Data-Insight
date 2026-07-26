import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Data Insight — AI-Powered Business Intelligence",
    template: "%s | Data Insight",
  },
  description:
    "Transform raw data into intelligent business decisions. AI-powered dashboards, forecasting, and executive reports.",
  keywords: [
    "business intelligence",
    "AI analytics",
    "data visualization",
    "forecasting",
    "dashboard builder",
  ],
  authors: [{ name: "Data Insight" }],
  creator: "Data Insight",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Data Insight — AI-Powered Business Intelligence",
    description:
      "Transform raw data into intelligent business decisions.",
    siteName: "Data Insight",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
