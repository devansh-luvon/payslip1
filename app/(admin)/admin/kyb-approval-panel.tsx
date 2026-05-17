"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface Employer {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  businessType: string | null;
  walletAddress: string;
  kybDocuments: Array<{ docType: string; fileUrl: string }>;
  createdAt: Date;
}

export function KybApprovalPanel({ employer }: { employer: Employer }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "APPROVE" | "REJECT") {
    setLoading(action === "APPROVE" ? "approve" : "reject");
    setError(null);
    const res = await fetch(`/api/admin/employers/${employer.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) { setError(json.error ?? "Action failed."); return; }
    router.refresh();
  }

  return (
    <div className="px-5 py-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">{employer.name}</p>
          <p className="text-xs text-zinc-400">{employer.companyName ?? "—"} · {employer.businessType ?? "—"}</p>
          <p className="text-xs text-zinc-500">{employer.email}</p>
          <p className="font-mono text-[10px] text-zinc-600 truncate mt-0.5">{employer.walletAddress}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            className="h-7 px-2.5 text-xs"
            loading={loading === "approve"}
            disabled={!!loading}
            onClick={() => act("APPROVE")}
          >
            <CheckCircle2 size={11} />
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="h-7 px-2.5 text-xs"
            loading={loading === "reject"}
            disabled={!!loading}
            onClick={() => act("REJECT")}
          >
            <XCircle size={11} />
            Reject
          </Button>
        </div>
      </div>

      {employer.kybDocuments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {employer.kybDocuments.map((doc) => (
            <a
              key={doc.docType}
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ExternalLink size={9} />
              {doc.docType === "COMPANY_PROOF" ? "Company Proof" : "ID Verification"}
            </a>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
