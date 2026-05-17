"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { Textarea } from "@/app/components/ui/input";

interface MilestoneActionsProps {
  milestoneId: string;
  status: string;
  payrollStatus: string;
}

export function MilestoneActions({ milestoneId, status, payrollStatus }: MilestoneActionsProps) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (payrollStatus === "FROZEN" || status !== "SUBMITTED") return null;

  async function approve() {
    setLoading(true);
    const res = await fetch(`/api/milestones/${milestoneId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "APPROVE" }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to approve."); return; }
    router.refresh();
  }

  async function reject() {
    if (!feedback.trim()) { setError("Rejection feedback is required."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/milestones/${milestoneId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REJECT", feedback: feedback.trim() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to reject."); return; }
    setRejectOpen(false);
    setFeedback("");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={approve} loading={loading} className="h-7 px-3 text-xs">
          <CheckCircle2 size={12} />
          Approve
        </Button>
        <Button size="sm" variant="danger" onClick={() => setRejectOpen(true)} className="h-7 px-3 text-xs">
          <XCircle size={12} />
          Reject
        </Button>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Milestone">
        <div className="space-y-4">
          <Textarea
            label="Feedback for worker"
            placeholder="Describe what needs to be improved…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setRejectOpen(false)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={reject} loading={loading} className="flex-1">Send Rejection</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
