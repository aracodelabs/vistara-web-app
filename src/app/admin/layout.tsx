import React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AdminToastProvider } from "@/components/admin/shared/AdminToastProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vistara Admin Portal",
    template: "%s | Vistara Admin Portal",
  },
  description:
    "Secure administration portal for Vistara Qatar Cleaning Services.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={plusJakarta.variable}>
      <body className="min-h-screen bg-[#F7F8F4] font-sans text-[#1B1F1C] antialiased">
        <AdminToastProvider>{children}</AdminToastProvider>
      </body>
    </html>
  );
}
