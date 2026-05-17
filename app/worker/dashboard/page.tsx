"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpRight, DollarSign, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge, statusVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { Input, Textarea } from "@/app/components/ui/input";
import { formatUsdc } from "@/lib/utils";

interface WorkerData {
  id: string;
  name: string;
  role?: string;
  walletAddress?: string;
  payroll: { id: string; name: string; payrollType: string; status: string; token: string };
  milestones: Array<{
    id: string; name: string; description?: string; amount: number;
    status: string; submissionUrl?: string; submissionNote?: string;
    rejectionFeedback?: string; expectedCompletion?: string;
    submittedAt?: string; approvedAt?: string; txHash?: string;
  }>;
  balance: { available: string; locked: string };
}

function SubmitMilestoneModal({
  milestoneId,
  milestoneName,
  open,
  onClose,
  onSuccess,
}: {
  milestoneId: string;
  milestoneName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setError(null);
    const res = await fetch(`/api/milestones/${milestoneId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionUrl: url || undefined, submissionNote: note || undefined }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to submit."); return; }
    onSuccess();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`Submit: ${milestoneName}`}>
      <div className="space-y-4">
        <Input
          label="Work Link (optional)"
          type="url"
          placeholder="https://figma.com/file/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          hint="Link to your deliverable (GitHub, Figma, Google Drive, etc.)"
        />
        <Textarea
          label="Notes (optional)"
          placeholder="Describe what you delivered…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={submit} loading={loading} className="flex-1">Submit for Review</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function WorkerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingMilestone, setSubmittingMilestone] = useState<{ id: string; name: string } | null>(null);

  async function fetchData() {
    const res = await fetch("/api/worker/me");
    if (res.status === 401) { router.push("/"); return; }
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-emerald-400" size={28} />
      </div>
    );
  }

  if (!data) return null;

  const paidMilestones = data.milestones.filter((m) => m.status === "PAID");
  const pendingMilestones = data.milestones.filter((m) => ["PENDING_SUBMISSION", "REJECTED"].includes(m.status));
  const reviewMilestones = data.milestones.filter((m) => m.status === "SUBMITTED");

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top bar */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold text-zinc-100">PaySlip</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-medium text-zinc-200">{data.name}</p>
            {data.role && <p className="text-[10px] text-zinc-500">{data.role}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
        </div>
      </header>

      <main className="p-5 max-w-2xl space-y-5">
        {/* Balance cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <DollarSign size={12} />
                Available Balance
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-400">
                ${formatUsdc(data.balance.available)}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">USDC</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Lock size={12} />
                Locked Earnings
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-300">
                ${formatUsdc(data.balance.locked)}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">USDC · pending milestones</p>
            </CardContent>
          </Card>
        </div>

        {/* Payroll info */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500">Payroll</p>
            <p className="text-sm font-medium text-zinc-100">{data.payroll.name}</p>
          </div>
          <Badge variant={statusVariant(data.payroll.status)}>{data.payroll.status}</Badge>
        </div>

        {/* Action needed */}
        {pendingMilestones.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-sm font-medium text-amber-300">
              {pendingMilestones.length} milestone{pendingMilestones.length !== 1 ? "s" : ""} ready to submit
            </p>
          </div>
        )}

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Your Milestones</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.milestones.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center text-zinc-500">No milestones assigned yet.</p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {data.milestones.map((m) => (
                  <div key={m.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-zinc-100">{m.name}</span>
                          <Badge variant={statusVariant(m.status)} className="text-[10px]">{m.status}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-emerald-400">
                          ${formatUsdc(m.amount)} USDC
                        </p>
                        {m.expectedCompletion && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Due {new Date(m.expectedCompletion).toLocaleDateString()}
                          </p>
                        )}
                        {m.description && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{m.description}</p>
                        )}
                        {m.rejectionFeedback && (
                          <p className="mt-1 text-xs text-red-400">
                            Feedback: {m.rejectionFeedback}
                          </p>
                        )}
                        {m.txHash && (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${m.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            Paid <ArrowUpRight size={10} />
                          </a>
                        )}
                      </div>

                      {(m.status === "PENDING_SUBMISSION" || m.status === "REJECTED") && (
                        <Button
                          size="sm"
                          className="shrink-0 h-7 px-3 text-xs"
                          onClick={() => setSubmittingMilestone({ id: m.id, name: m.name })}
                        >
                          Submit
                        </Button>
                      )}
                      {m.status === "SUBMITTED" && (
                        <Badge variant="warning" className="shrink-0">Under Review</Badge>
                      )}
                      {m.status === "PAID" && (
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet info */}
        {data.walletAddress && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 space-y-1">
            <p className="text-xs text-zinc-500">Your Stellar Wallet</p>
            <p className="font-mono text-xs text-zinc-400 break-all">{data.walletAddress}</p>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${data.walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              View on Stellar Expert <ArrowUpRight size={10} />
            </a>
          </div>
        )}
      </main>

      {submittingMilestone && (
        <SubmitMilestoneModal
          milestoneId={submittingMilestone.id}
          milestoneName={submittingMilestone.name}
          open={true}
          onClose={() => setSubmittingMilestone(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
