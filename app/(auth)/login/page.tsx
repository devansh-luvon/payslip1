"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["EMPLOYER", "ADMIN"]),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "EMPLOYER" },
  });

  async function onSubmit(data: FormValues) {
    setServerError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Invalid credentials.");
      return;
    }

    if (data.role === "ADMIN") {
      router.push("/admin");
    } else {
      const employer = json.data;
      if (!employer.isApproved) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            PaySlip
          </a>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-50">Welcome back</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-emerald-400 hover:text-emerald-300">
              Sign up
            </Link>
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Role selector */}
              <div className="flex rounded-lg border border-zinc-800 p-1">
                {(["EMPLOYER", "ADMIN"] as const).map((r) => (
                  <label key={r} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      value={r}
                      className="sr-only"
                      {...register("role")}
                    />
                    <span className="block rounded-md py-1.5 text-center text-xs font-medium transition-colors [input:checked+&]:bg-zinc-800 [input:checked+&]:text-zinc-100 text-zinc-500 hover:text-zinc-300">
                      {r === "EMPLOYER" ? "Employer" : "Admin"}
                    </span>
                  </label>
                ))}
              </div>

              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Your password"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register("password")}
              />

              {serverError && (
                <p className="text-sm text-red-400">{serverError}</p>
              )}

              <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
