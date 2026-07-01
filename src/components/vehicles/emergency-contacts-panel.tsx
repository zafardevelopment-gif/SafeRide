"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Phone, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SubmitButton from "@/components/shared/submit-button";
import {
  createEmergencyContact,
  deleteEmergencyContact,
} from "@/actions/emergency-contact";
import type { EmergencyContact } from "@/types";

interface EmergencyContactsPanelProps {
  vehicleId: string;
  initialContacts: EmergencyContact[];
}

export default function EmergencyContactsPanel({
  vehicleId,
  initialContacts,
}: EmergencyContactsPanelProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", relation: "", phone: "" });

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createEmergencyContact(vehicleId, form);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to add contact");
      return;
    }
    setContacts((prev) => [...prev, result.data!]);
    setForm({ name: "", relation: "", phone: "" });
    setAdding(false);
    toast.success("Emergency contact added");
  }

  async function handleDelete(id: string) {
    const result = await deleteEmergencyContact(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to remove contact");
      return;
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contact removed");
  }

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Emergency Contacts</h2>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
        </div>

        {contacts.length === 0 && !adding && (
          <p className="text-sm text-gray-400 py-2">
            No emergency contacts yet. Add at least one so people can reach someone during an emergency.
          </p>
        )}

        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                  <p className="text-xs text-gray-500">
                    {contact.relation} · {contact.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary" className="text-[10px]">
                  Priority {contact.priority_order}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleDelete(contact.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Remove contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="mt-3 space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">New contact</p>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_name">Name</Label>
              <Input
                id="contact_name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact_relation">Relation</Label>
                <Input
                  id="contact_relation"
                  placeholder="Father, Spouse..."
                  value={form.relation}
                  onChange={(e) => set("relation", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>
            <SubmitButton loading={loading} className="w-full">
              Save contact
            </SubmitButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
