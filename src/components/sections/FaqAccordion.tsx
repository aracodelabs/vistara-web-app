"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-[#013220]/10 rounded-2xl border border-[#013220]/12 bg-white shadow-sm">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div key={index} className="px-5 py-4 sm:px-7 sm:py-5">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-1 text-start text-base font-semibold text-[#013220] transition-colors hover:text-[#014421] cursor-pointer sm:text-lg"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0E8] text-[#014421] transition-transform duration-200",
                    isOpen && "rotate-180 bg-[#014421] text-white"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={cn(
                "overflow-hidden pt-3 text-sm leading-relaxed text-[#1B1F1C]/85 sm:text-base",
                !isOpen && "hidden"
              )}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
