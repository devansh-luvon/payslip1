"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/app/components/ui/button";
import { Input, Textarea, Select } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { FileUpload } from "@/app/components/ui/file-upload";
import { Badge } from "@/app/components/ui/badge";
import { calculatePlatformFee, totalWithFee, formatUsdc } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Wallet, AlertCircle
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;

interface Worker { name: string; phone: string; role?: string }
interface MilestoneInput { name: string; description: string; amount: string; workerId?: string; expectedCompletion: string }
interface TaskInput { name: string; amount: string; workerId?: string }
interface CreatedWorker { id: string; name: string; role?: string }

const STEPS = ["Basic Info", "Workers", "Milestones / Tasks", "Review & Fund"];

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const stepNum = (i + 1) as Step;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
              active ? "bg-emerald-500/10 text-emerald-400" :
              done ? "text-emerald-400" : "text-zinc-600"
            }`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                done ? "bg-emerald-500 text-zinc-950" :
                active ? "border-2 border-emerald-500 text-emerald-400" :
                "border border-zinc-700 text-zinc-600"
              }`}>
                {done ? "✓" : stepNum}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${done ? "bg-emerald-500" : "bg-zinc-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CreatePayrollContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspace") ?? "";

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [payrollName, setPayrollName] = useState("");
  const [payrollType, setPayrollType] = useState<"MILESTONE" | "SCHEDULED">("MILESTONE");
  const [payrollId, setPayrollId] = useState<string | null>(null);

  // Step 2
  const [csvWorkers, setCsvWorkers] = useState<Worker[]>([]);
  const [createdWorkers, setCreatedWorkers] = useState<CreatedWorker[]>([]);

  // Step 3 — Milestones
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { name: "", description: "", amount: "", workerId: undefined, expectedCompletion: "" },
  ]);

  // Step 3 — Scheduled tasks
  const [tasks, setTasks] = useState<TaskInput[]>([
    { name: "", amount: "", workerId: undefined },
  ]);

  // Step 4 — funding
  const [totalAmount, setTotalAmount] = useState(0);
  const [fundingTxHash, setFundingTxHash] = useState("");
  const [contractId, setContractId] = useState("");

  // Recalculate total when milestones/tasks change
  useEffect(() => {
    if (payrollType === "MILESTONE") {
      const t = milestones.reduce((a, m) => a + (parseFloat(m.amount) || 0), 0);
      setTotalAmount(t);
    } else {
      const t = tasks.reduce((a, t) => a + (parseFloat(t.amount) || 0), 0);
      setTotalAmount(t);
    }
  }, [milestones, tasks, payrollType]);

  // ── Step 1: Create Payroll ────────────────────────────────────────────────
  async function submitStep1() {
    if (!payrollName.trim()) { setError("Payroll name is required."); return; }
    if (!workspaceId) { setError("Workspace ID missing. Go back and try again."); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: payrollName.trim(), workspaceId, payrollType }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to create payroll."); return; }
    setPayrollId(json.data.id);
    setStep(2);
  }

  // ── Step 2: Upload Workers ────────────────────────────────────────────────
  function parseCSV(file: File | null) {
    if (!file) { setCsvWorkers([]); return; }
    Papa.parse<Worker>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setCsvWorkers(results.data),
    });
  }

  async function submitStep2() {
    if (csvWorkers.length === 0) { setError("Please upload a workers CSV."); return; }
    setLoading(true); setError(null);
    const res = await fetch(`/api/payroll/${payrollId}/workers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workers: csvWorkers }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to upload workers."); return; }
    setCreatedWorkers(json.data.workers);
    setStep(3);
  }

  // ── Step 3: Milestones / Tasks ────────────────────────────────────────────
  async function submitStep3() {
    setLoading(true); setError(null);
    if (payrollType === "MILESTONE") {
      const invalid = milestones.find((m) => !m.name.trim() || !m.amount || !m.workerId);
      if (invalid) { setLoading(false); setError("All milestones need a name, amount, and assigned worker."); return; }

      const res = await fetch(`/api/payroll/${payrollId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestones: milestones.map((m) => ({
            name: m.name,
            description: m.description,
            amount: parseFloat(m.amount),
            workerId: m.workerId,
            expectedCompletion: m.expectedCompletion || undefined,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setLoading(false); setError(json.error ?? "Failed to save milestones."); return; }
    } else {
      const invalid = tasks.find((t) => !t.name.trim() || !t.amount || !t.workerId);
      if (invalid) { setLoading(false); setError("All tasks need a name, amount, and assigned worker."); return; }

      const res = await fetch(`/api/payroll/${payrollId}/scheduled-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map((t) => ({
            name: t.name,
            amount: parseFloat(t.amount),
            workerId: t.workerId,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setLoading(false); setError(json.error ?? "Failed to save tasks."); return; }
    }

    setLoading(false);
    setStep(4);
  }

  // ── Step 4: Fund Escrow ───────────────────────────────────────────────────
  async function confirmFunding() {
    if (!fundingTxHash.trim()) { setError("Paste the Stellar transaction hash after funding."); return; }
    setLoading(true); setError(null);
    const res = await fetch(`/api/payroll/${payrollId}/fund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash: fundingTxHash.trim(),
        contractId: contractId.trim() || undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to confirm funding."); return; }
    router.push(`/dashboard/payroll/${payrollId}`);
  }

  const platformFee = calculatePlatformFee(totalAmount);
  const totalRequired = totalWithFee(totalAmount);

  const workerOptions = [
    { value: "", label: "Assign to worker..." },
    ...createdWorkers.map((w) => ({ value: w.id, label: w.name + (w.role ? ` (${w.role})` : "") })),
  ];

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Create Payroll</h1>
        <p className="mt-1 text-sm text-zinc-500">Set up a new payroll in a few steps.</p>
      </div>

      <StepBar current={step} />

      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* ── Step 1 ────────────────────────────────────── */}
          {step === 1 && (
            <>
              <Input
                label="Payroll Name"
                placeholder="e.g. Q4 2024 Milestone Payroll"
                value={payrollName}
                onChange={(e) => setPayrollName(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-zinc-300">Payroll Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["MILESTONE", "SCHEDULED"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPayrollType(t)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        payrollType === t
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${payrollType === t ? "text-emerald-400" : "text-zinc-200"}`}>
                        {t === "MILESTONE" ? "Milestone" : "Scheduled"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {t === "MILESTONE"
                          ? "Workers get paid upon milestone approval"
                          : "Fixed tasks with defined amounts"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={submitStep1} loading={loading} className="w-full" size="lg">
                Continue <ChevronRight size={16} />
              </Button>
            </>
          )}

          {/* ── Step 2 ────────────────────────────────────── */}
          {step === 2 && (
            <>
              <FileUpload
                label="Upload Workers CSV"
                accept=".csv"
                onChange={parseCSV}
                hint="Required columns: name, phone (or phoneNumber), role (optional)"
              />
              {csvWorkers.length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50">
                  <div className="px-4 py-2.5 border-b border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-400">{csvWorkers.length} workers found</p>
                  </div>
                  <div className="max-h-48 overflow-auto divide-y divide-zinc-800">
                    {csvWorkers.slice(0, 20).map((w, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2 text-xs">
                        <span className="text-zinc-300">{w.name}</span>
                        <div className="flex gap-3 text-zinc-500">
                          <span>{w.phone ?? w.phoneNumber}</span>
                          {w.role && <span>{w.role}</span>}
                        </div>
                      </div>
                    ))}
                    {csvWorkers.length > 20 && (
                      <div className="px-4 py-2 text-xs text-zinc-600">
                        +{csvWorkers.length - 20} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  <ChevronLeft size={14} /> Back
                </Button>
                <Button onClick={submitStep2} loading={loading} className="flex-1" size="lg">
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 3 Milestones ─────────────────────────── */}
          {step === 3 && payrollType === "MILESTONE" && (
            <>
              <div className="space-y-4">
                {milestones.map((m, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-400">Milestone {i + 1}</p>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMilestones((prev) => prev.filter((_, j) => j !== i))}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Milestone Name"
                        placeholder="Wireframe Design"
                        value={m.name}
                        onChange={(e) => setMilestones((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      />
                      <Input
                        label="Amount (USDC)"
                        type="number"
                        placeholder="500"
                        value={m.amount}
                        onChange={(e) => setMilestones((prev) => prev.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                      />
                    </div>
                    <Select
                      label="Assign to Worker"
                      options={workerOptions}
                      value={m.workerId ?? ""}
                      onChange={(e) => setMilestones((prev) => prev.map((x, j) => j === i ? { ...x, workerId: e.target.value || undefined } : x))}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Expected Completion"
                        type="date"
                        value={m.expectedCompletion}
                        onChange={(e) => setMilestones((prev) => prev.map((x, j) => j === i ? { ...x, expectedCompletion: e.target.value } : x))}
                      />
                      <Textarea
                        label="Description (optional)"
                        placeholder="Describe the milestone deliverable..."
                        value={m.description}
                        onChange={(e) => setMilestones((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setMilestones((prev) => [...prev, { name: "", description: "", amount: "", workerId: undefined, expectedCompletion: "" }])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <Plus size={14} />
                  Add milestone
                </button>
              </div>

              {totalAmount > 0 && (
                <div className="rounded-lg bg-zinc-950/60 p-3 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>${formatUsdc(totalAmount)} USDC</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-xs mt-1">
                    <span>Platform fee (1%)</span>
                    <span>${formatUsdc(platformFee)} USDC</span>
                  </div>
                  <div className="flex justify-between font-semibold text-zinc-100 border-t border-zinc-800 mt-2 pt-2">
                    <span>Total Required</span>
                    <span>${formatUsdc(totalRequired)} USDC</span>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                  <ChevronLeft size={14} /> Back
                </Button>
                <Button onClick={submitStep3} loading={loading} className="flex-1" size="lg">
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 3 Scheduled Tasks ────────────────────── */}
          {step === 3 && payrollType === "SCHEDULED" && (
            <>
              <div className="space-y-3">
                {tasks.map((t, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-400">Task {i + 1}</p>
                      {tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTasks((prev) => prev.filter((_, j) => j !== i))}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Task Name"
                        placeholder="Monthly salary"
                        value={t.name}
                        onChange={(e) => setTasks((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      />
                      <Input
                        label="Amount (USDC)"
                        type="number"
                        placeholder="1000"
                        value={t.amount}
                        onChange={(e) => setTasks((prev) => prev.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                      />
                    </div>
                    <Select
                      label="Assign to Worker"
                      options={workerOptions}
                      value={t.workerId ?? ""}
                      onChange={(e) => setTasks((prev) => prev.map((x, j) => j === i ? { ...x, workerId: e.target.value || undefined } : x))}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setTasks((prev) => [...prev, { name: "", amount: "", workerId: undefined }])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <Plus size={14} />
                  Add task
                </button>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                  <ChevronLeft size={14} /> Back
                </Button>
                <Button onClick={submitStep3} loading={loading} className="flex-1" size="lg">
                  Continue <ChevronRight size={16} />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 4 Review & Fund ──────────────────────── */}
          {step === 4 && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-300">Review Summary</h3>
                <div className="rounded-xl border border-zinc-800 divide-y divide-zinc-800">
                  {[
                    { label: "Payroll Name", value: payrollName },
                    { label: "Type", value: payrollType },
                    { label: "Workers", value: `${createdWorkers.length}` },
                    {
                      label: payrollType === "MILESTONE" ? "Milestones" : "Tasks",
                      value: `${payrollType === "MILESTONE" ? milestones.length : tasks.length}`,
                    },
                    { label: "Total Payroll", value: `$${formatUsdc(totalAmount)} USDC` },
                    { label: "Platform Fee (1%)", value: `$${formatUsdc(platformFee)} USDC` },
                    { label: "Total Required Deposit", value: `$${formatUsdc(totalRequired)} USDC`, highlight: true },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between px-4 py-2.5">
                      <span className="text-sm text-zinc-500">{row.label}</span>
                      <span className={`text-sm font-medium ${row.highlight ? "text-emerald-400" : "text-zinc-200"}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Wallet size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">Fund the Escrow</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Use your Freighter wallet to send{" "}
                        <span className="font-semibold text-zinc-200">${formatUsdc(totalRequired)} USDC</span> to the PaySlip escrow contract.
                        After sending, paste the transaction hash below.
                      </p>
                    </div>
                  </div>

                  <Input
                    label="Transaction Hash"
                    placeholder="Paste Stellar tx hash after funding..."
                    value={fundingTxHash}
                    onChange={(e) => setFundingTxHash(e.target.value)}
                    hint="Example: abc123... (64 hex characters)"
                  />
                  <Input
                    label="Contract ID (optional)"
                    placeholder="Deployed Soroban contract address"
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                  />
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <AlertCircle size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-zinc-500">
                    Funds are held in the non-custodial Soroban escrow contract, not by PaySlip.
                    Workers are paid only upon your approval of each milestone.
                  </p>
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(3)} className="flex-1">
                  <ChevronLeft size={14} /> Back
                </Button>
                <Button onClick={confirmFunding} loading={loading} className="flex-1" size="lg">
                  <CheckCircle2 size={16} />
                  Activate Payroll
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreatePayrollPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Loading…</div>}>
      <CreatePayrollContent />
    </Suspense>
  );
}
