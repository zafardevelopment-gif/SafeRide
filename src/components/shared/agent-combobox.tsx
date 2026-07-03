"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  referral_code: string;
}

interface AgentComboboxProps {
  agents: Agent[];
  value: string;
  onChange: (agentId: string) => void;
  disabled?: boolean;
}

export default function AgentCombobox({ agents, value, onChange, disabled }: AgentComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mounted = typeof document !== "undefined";

  const selected = agents.find((a) => a.id === value) ?? null;

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const update = () => {
      const r = buttonRef.current!.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) => a.name.toLowerCase().includes(q) || a.referral_code.toLowerCase().includes(q)
    );
  }, [agents, query]);

  function handleSelect(agentId: string) {
    onChange(agentId);
    setOpen(false);
    setQuery("");
  }

  const panel = open && rect && (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
      <div
        className="fixed z-50 rounded-lg border border-border bg-white shadow-lg overflow-hidden"
        style={{ top: rect.top, left: rect.left, width: rect.width }}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type agent name or code..."
            className="w-full text-sm text-gray-900 focus:outline-none"
          />
        </div>
        <div className="max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-400">No matching agents.</p>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => handleSelect(a.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50"
              >
                <span className="min-w-0 truncate">
                  {a.name} <span className="text-gray-400 font-mono">({a.referral_code})</span>
                </span>
                {a.id === value && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full h-9 rounded-lg border border-border bg-white px-3 text-sm text-gray-900 flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? `${selected.name} (${selected.referral_code})` : agents.length === 0 ? "No agents available" : "Select an agent"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {mounted && panel && createPortal(panel, document.body)}
    </div>
  );
}
