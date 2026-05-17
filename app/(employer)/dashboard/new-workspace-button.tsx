"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Modal } from "@/app/components/ui/modal";

export function NewWorkspaceButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) { setError("Workspace name is required."); return; }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) { setError(json.error ?? "Failed to create workspace."); return; }
    setOpen(false);
    setName("");
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus size={14} />
        New Workspace
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Workspace">
        <div className="space-y-4">
          <Input
            label="Workspace Name"
            placeholder="e.g. Engineering Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") create(); }}
            error={error ?? undefined}
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={create} loading={loading} className="flex-1">
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
