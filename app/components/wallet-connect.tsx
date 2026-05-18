"use client";

import { useState, useEffect } from "react";
import { Wallet, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface WalletConnectProps {
  onConnected: (publicKey: string) => void;
  connected?: boolean;
  walletAddress?: string;
}

export function WalletConnect({ onConnected, connected, walletAddress }: WalletConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null = still detecting, true = extension found, false = not found
  const [detected, setDetected] = useState<boolean | null>(null);

  useEffect(() => {
    let attempts = 0;

    async function detect() {
      try {
        const { isConnected } = await import("@stellar/freighter-api");
        const result = await isConnected();
        // v3.1.0: returns { isConnected: boolean, error?: ... }
        // If error is present the extension isn't communicating, but we still
        // show the button — let requestAccess surface the real problem.
        if (result.error && !result.isConnected && attempts < 8) {
          attempts++;
          setTimeout(detect, 250);
          return;
        }
        setDetected(true);
      } catch {
        if (attempts < 8) {
          attempts++;
          setTimeout(detect, 250);
        } else {
          setDetected(false);
        }
      }
    }

    detect();
  }, []);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const { requestAccess } = await import("@stellar/freighter-api");
      // requestAccess opens the Freighter popup and returns { address, error? }
      const result = await requestAccess();

      if (result.error) {
        const msg = (result.error as { message?: string }).message ?? String(result.error);
        if (msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("denied")) {
          throw new Error("Connection rejected. Open Freighter and approve the request.");
        }
        throw new Error(msg);
      }

      const address = (result as unknown as { address: string }).address;
      if (!address) throw new Error("Freighter did not return an address.");
      onConnected(address);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet.");
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setDetected(null);
    setError(null);
    let attempts = 0;
    async function detect() {
      try {
        const { isConnected } = await import("@stellar/freighter-api");
        const result = await isConnected();
        if (result.error && !result.isConnected && attempts < 8) {
          attempts++;
          setTimeout(detect, 250);
          return;
        }
        setDetected(true);
      } catch {
        if (attempts < 8) { attempts++; setTimeout(detect, 250); }
        else setDetected(false);
      }
    }
    setTimeout(detect, 300);
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  if (connected && walletAddress) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-emerald-400">Wallet Connected</p>
          <p className="truncate font-mono text-xs text-zinc-400">{walletAddress}</p>
        </div>
      </div>
    );
  }

  // ── Detecting ─────────────────────────────────────────────────────────────
  if (detected === null) {
    return (
      <div className="flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 text-sm text-zinc-500">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
        Detecting Freighter…
      </div>
    );
  }

  // ── Extension not found after retries ─────────────────────────────────────
  if (detected === false) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-400">Freighter not detected</p>
          <p className="mt-1 text-xs text-zinc-400">
            Install the{" "}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 underline hover:text-emerald-300"
            >
              Freighter extension
            </a>
            , unlock it, then click Retry.
          </p>
        </div>
        <Button variant="secondary" className="w-full" onClick={retry}>
          <RefreshCw size={14} />
          Retry Detection
        </Button>
      </div>
    );
  }

  // ── Extension found — show connect button ─────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        onClick={connect}
        loading={loading}
        variant="secondary"
        className="w-full"
      >
        <Wallet size={16} />
        {loading ? "Connecting…" : "Connect Freighter Wallet"}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
