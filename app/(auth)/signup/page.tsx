"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { WalletConnect } from "@/app/components/wallet-connect";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { ArrowRight } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormValues) {
    if (!walletAddress) {
      setServerError("Please connect your Freighter wallet first.");
      return;
    }
    setServerError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, walletAddress }),
    });

    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Something went wrong.");
      return;
    }

    router.push("/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            PaySlip
          </a>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-50">Create your employer account</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
              Sign in
            </Link>
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5 pt-6">
            {/* Step 1: Connect wallet */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Step 1 — Connect Wallet
              </p>
              <WalletConnect
                onConnected={(pk) => setWalletAddress(pk)}
                connected={!!walletAddress}
                walletAddress={walletAddress ?? undefined}
              />
            </div>

            {walletAddress && (
              <>
                <div className="border-t border-zinc-800" />
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Step 2 — Account Details
                  </p>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                      label="Your Name"
                      placeholder="Alex Johnson"
                      error={errors.name?.message}
                      {...register("name")}
                    />
                    <Input
                      label="Work Email"
                      type="email"
                      placeholder="alex@company.com"
                      error={errors.email?.message}
                      {...register("email")}
                    />
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Min. 8 characters"
                      error={errors.password?.message}
                      {...register("password")}
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Repeat password"
                      error={errors.confirmPassword?.message}
                      {...register("confirmPassword")}
                    />

                    {serverError && (
                      <p className="text-sm text-red-400">{serverError}</p>
                    )}

                    <Button
                      type="submit"
                      loading={isSubmitting}
                      className="w-full"
                      size="lg"
                    >
                      Create Account
                      <ArrowRight size={16} />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-600">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
