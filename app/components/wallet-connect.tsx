"use client";

import { useState, useEffect } from "react";
import { Wallet, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

interface WalletConnectProps {
  onConnected: (publicKey: string) => void;
  connected?: boolean;
  walletAddress?: string;
}

export function WalletConnect({ onConnected, connected, walletAddress }: WalletConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freighterAvailable, setFreighterAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect Freighter after hydration
    import("@stellar/freighter-api")
      .then(({ isConnected }) => isConnected())
      .then((result) => {
        // isConnected returns {isConnected: bool} or bool depending on version
        const available = typeof result === "boolean" ? result : (result as { isConnected: boolean }).isConnected;
        setFreighterAvailable(true);
        if (available) {
          // Already connected — fetch public key
          return import("@stellar/freighter-api").then(({ getPublicKey }) => getPublicKey());
        }
      })
      .catch(() => setFreighterAvailable(false));
  }, []);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const { requestAccess, getPublicKey } = await import("@stellar/freighter-api");
      await requestAccess();
      const result = await getPublicKey();
      const pk = typeof result === "string" ? result : (result as { publicKey: string }).publicKey;
      if (!pk) throw new Error("Could not retrieve public key from Freighter.");
      onConnected(pk);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet.");
    } finally {
      setLoading(false);
    }
  }

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

  if (freighterAvailable === false) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
        Freighter wallet extension not found.{" "}
        <a
          href="https://freighter.app"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-amber-300"
        >
          Install Freighter
        </a>{" "}
        to continue.
      </div>
    );
  }

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
