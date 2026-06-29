"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export default function SubmitButton({ loading = false, children, className, ...props }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-9 text-sm font-medium",
        "bg-primary text-primary-foreground hover:bg-primary/80 transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
