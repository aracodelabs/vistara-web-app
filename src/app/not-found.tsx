import React from "react";
import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#F7F8F4] px-4 text-center text-[#1B1F1C]">
        <div className="max-w-md rounded-3xl border border-[#013220]/10 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold tracking-widest text-[#355E3B] uppercase">
            404
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#013220]">
            Page Not Found
          </h1>
          <Link
            href="/en"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-[#014421] px-6 text-sm font-semibold text-white hover:bg-[#013220]"
          >
            Go to Homepage
          </Link>
        </div>
      </body>
    </html>
  );
}
