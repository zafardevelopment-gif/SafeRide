"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  onComplete: (token: string) => void;
  loading?: boolean;
  length?: number;
}

export default function OTPInput({ onComplete, loading = false, length = 6 }: OTPInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function focusAt(index: number) {
    refs.current[index]?.focus();
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < length - 1) focusAt(index + 1);
    if (next.every(Boolean)) onComplete(next.join(""));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusAt(index - 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setDigits(next);
    focusAt(Math.min(pasted.length, length - 1));
    if (pasted.length === length) onComplete(pasted);
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={loading}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "w-11 h-12 text-center text-xl font-bold border border-border rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            digit && "border-blue-500 bg-blue-50"
          )}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
