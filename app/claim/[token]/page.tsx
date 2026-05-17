"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge, statusVariant } from "@/app/components/ui/badge";
import { formatUsdc } from "@/lib/utils";

type ClaimStep = "loading" | "phone" | "otp" | "creating_wallet" | "done" | "error";

interface ClaimInfo {
  workerName: string;
  workerRole?: string;
  payrollName: string;
  payrollType: string;
  isOnboarded: boolean;
  milestones: Array<{ id: string; name: string; amount: number; status: string }>;
}

export default function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [claimStep, setClaimStep] = useState<ClaimStep>("loading");
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetch(`/api/worker/claim/${t}`)
        .then((r) => r.json())
        .then((json) => {
          if (!json.success) { setClaimStep("error"); setError(json.error ?? "Invalid link."); return; }
          setClaimInfo(json.data);
          if (json.data.isOnboarded) {
            router.replace("/worker/dashboard");
          } else {
            setClaimStep("phone");
          }
        })
        .catch(() => { setClaimStep("error"); setError("Could not load claim info."); });
    });
  }, [params, router]);

  async function sendOtp() {
    if (!phone.trim()) { setError("Enter your phone number."); return; }
    setLoading(true); setError(null);
    const res = await fetch(`/api/worker/claim/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { setError(json.error ?? "Failed to send OTP."); return; }
    setClaimStep("otp");
  }

  async function verifyOtp() {
    if (otp.length !== 6) { setError("Enter the 6-digit code."); return; }
    setLoading(true); setError(null);
    setClaimStep("creating_wallet");

    const res = await fetch("/api/worker/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimToken: token, phone: phone.trim(), otp }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setClaimStep("otp");
      setError(json.error ?? "OTP verification failed.");
      return;
    }
    setClaimStep("done");
    setTimeout(() => router.push("/worker/dashboard"), 2000);
  }

  if (claimStep === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-emerald-400" size={28} />
      </div>
    );
  }

  if (claimStep === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-10 space-y-3">
            <p className="text-4xl">🔗</p>
            <h2 className="text-lg font-semibold text-zinc-50">Link Not Found</h2>
            <p className="text-sm text-zinc-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimStep === "creating_wallet") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-10 space-y-4">
            <Loader2 className="animate-spin text-emerald-400 mx-auto" size={32} />
            <h2 className="text-lg font-semibold text-zinc-50">Setting up your wallet</h2>
            <p className="text-sm text-zinc-400">
              Creating your Stellar wallet securely. This only takes a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimStep === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-10 space-y-4">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
            <h2 className="text-xl font-semibold text-zinc-50">You&apos;re all set!</h2>
            <p className="text-sm text-zinc-400">
              Welcome, {claimInfo?.workerName}. Your wallet is ready. Redirecting to your dashboard…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalLocked = claimInfo?.milestones.reduce((a, m) => a + Number(m.amount), 0) ?? 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            PaySlip
          </div>
          <h1 className="text-2xl font-semibold text-zinc-50">
            You have earnings waiting
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {claimInfo?.workerName} · {claimInfo?.payrollName}
          </p>
        </div>

        {/* Earnings preview */}
        {claimInfo && claimInfo.milestones.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Your Milestones</p>
              {claimInfo.milestones.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-medium">${formatUsdc(m.amount)}</span>
                    <Badge variant={statusVariant(m.status)} className="text-[10px]">{m.status}</Badge>
                  </div>
                </div>
              ))}
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-zinc-300">Total</span>
                <span className="text-emerald-400">${formatUsdc(totalLocked)} USDC</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phone step */}
        {claimStep === "phone" && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <Shield size={16} className="text-emerald-400 shrink-0" />
                <p className="text-xs text-zinc-400">
                  Verify your phone number to claim your earnings and create your wallet.
                </p>
              </div>
              <Input
                label="Your Phone Number"
                type="tel"
                placeholder="+1 555 000 1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                hint="Include country code (e.g. +1, +44, +91)"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={sendOtp} loading={loading} className="w-full" size="lg">
                <Smartphone size={16} />
                Send OTP
              </Button>
            </CardContent>
          </Card>
        )}

        {/* OTP step */}
        {claimStep === "otp" && (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm text-zinc-400 text-center">
                Enter the 6-digit code sent to <span className="text-zinc-200">{phone}</span>
              </p>
              <Input
                label="Verification Code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-xl tracking-[0.5em]"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={verifyOtp} loading={loading} className="w-full" size="lg">
                Verify &amp; Claim
              </Button>
              <button
                type="button"
                onClick={() => { setClaimStep("phone"); setOtp(""); setError(null); }}
                className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← Change phone number
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
