"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyButton({ text, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border",
        "bg-white hover:bg-gray-50 text-gray-600 transition-colors shrink-0",
        copied && "text-green-600 border-green-200 bg-green-50",
        className
      )}
    >
      {copied ? (
        <><Check className="w-3.5 h-3.5" /> {label ? "Copied!" : ""}</>
      ) : (
        <><Copy className="w-3.5 h-3.5" /> {label ?? ""}</>
      )}
    </button>
  );
}
