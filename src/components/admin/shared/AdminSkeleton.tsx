"use client";

import React from "react";

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#013220]/10 bg-white p-5">
      <div className="h-5 w-44 animate-pulse rounded-md bg-[#E8F0E8]" />
      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 rounded-xl border border-[#013220]/5 bg-[#F7F8F4]/70 p-3"
          >
            <div className="h-4 w-1/4 animate-pulse rounded bg-[#E8F0E8]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#E8F0E8]" />
            <div className="h-4 w-1/5 animate-pulse rounded bg-[#E8F0E8]" />
            <div className="ml-auto h-6 w-16 animate-pulse rounded-full bg-[#E8F0E8]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-[#013220]/10 bg-white p-5 shadow-xs"
        >
          <div className="h-3.5 w-24 animate-pulse rounded bg-[#E8F0E8]" />
          <div className="mt-3 h-7 w-16 animate-pulse rounded bg-[#E8F0E8]" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-[#F7F8F4]" />
        </div>
      ))}
    </div>
  );
}
