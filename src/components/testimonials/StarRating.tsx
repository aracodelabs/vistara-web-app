"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingDisplay({
  rating,
  ariaLabel,
  size = "md",
}: {
  rating: number;
  ariaLabel: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <Star
            key={star}
            aria-hidden="true"
            className={cn(
              sizeClass,
              filled
                ? "fill-[#6BAE00] text-[#6BAE00]"
                : "fill-transparent text-[#013220]/20"
            )}
          />
        );
      })}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
  groupLabel,
  starLabelTemplate,
}: {
  value: number;
  onChange: (rating: number) => void;
  groupLabel: string;
  starLabelTemplate: (stars: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeValue = hovered ?? value;

  function handleKeyDown(e: React.KeyboardEvent, star: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, star + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, star - 1));
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={groupLabel}
      className="inline-flex items-center gap-1 rounded-2xl border border-[#013220]/15 bg-[#F7F8F4] px-2 py-1"
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = star === value;
        const highlighted = star <= activeValue;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={starLabelTemplate(star)}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#014421] cursor-pointer"
          >
            <Star
              aria-hidden="true"
              className={cn(
                "h-6 w-6 transition-colors",
                highlighted
                  ? "fill-[#6BAE00] text-[#6BAE00]"
                  : "fill-transparent text-[#013220]/25"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
