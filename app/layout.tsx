import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Analytics } from "@/components/analytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "ActProve — EU AI Act Compliance for SMBs",
    template: "%s · ActProve",
  },
  description:
    "From AI inventory to audit-ready compliance documentation, living registers, and client-facing Trust Pages — in under 2 hours.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://actprove.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable,
        )}
      >
        <TRPCProvider>{children}</TRPCProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
