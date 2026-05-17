"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/app/components/ui/button";
import { Input, Select } from "@/app/components/ui/input";
import { FileUpload } from "@/app/components/ui/file-upload";
import { Card, CardContent } from "@/app/components/ui/card";
import { CheckCircle2, Clock } from "lucide-react";

type Step = 1 | 2 | 3;

const step1Schema = z.object({
  name: z.string().min(2),
  companyName: z.string().min(2),
  businessType: z.string().min(2),
  contactPerson: z.string().min(2),
});

type Step1Values = z.infer<typeof step1Schema>;

const BUSINESS_TYPES = [
  { value: "", label: "Select business type" },
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership" },
  { value: "Private Limited", label: "Private Limited" },
  { value: "Corporation", label: "Corporation" },
  { value: "NGO / Non-Profit", label: "NGO / Non-Profit" },
  { value: "Other", label: "Other" },
];

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
              step < current
                ? "bg-emerald-500 text-zinc-950"
                : step === current
                ? "border-2 border-emerald-500 text-emerald-400"
                : "border border-zinc-700 text-zinc-600"
            }`}
          >
            {step < current ? <CheckCircle2 size={14} /> : step}
          </div>
          {step < total && <div className={`h-px w-8 ${step < current ? "bg-emerald-500" : "bg-zinc-700"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [companyProofFile, setCompanyProofFile] = useState<File | null>(null);
  const [idVerifFile, setIdVerifFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
  });

  async function submitStep1(data: Step1Values) {
    setServerError(null);
    const res = await fetch("/api/employer/kyb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error ?? "Something went wrong."); return; }
    setStep(2);
  }

  async function submitStep2() {
    setFileError(null);
    if (!companyProofFile || !idVerifFile) {
      setFileError("Both documents are required.");
      return;
    }
    setSubmitting(true);

    // For MVP, we simulate file upload by using placeholder URLs
    // In production, upload to S3/Cloudflare R2 and get URLs
    const companyProofUrl = `placeholder://company-proof/${companyProofFile.name}`;
    const idVerificationUrl = `placeholder://id-verification/${idVerifFile.name}`;

    const res = await fetch("/api/employer/kyb", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyProofUrl, idVerificationUrl }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { setServerError(json.error ?? "Upload failed."); return; }
    setStep(3);
  }

  if (step === 3) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="space-y-4 py-10">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                <Clock size={28} className="text-amber-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-zinc-50">KYB Submitted</h2>
            <p className="text-sm text-zinc-400 max-w-xs mx-auto">
              Your verification documents are under review. We&apos;ll notify you by email once your account is approved (typically within 24 hours).
            </p>
            <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            PaySlip
          </a>
          <h1 className="mt-3 text-2xl font-semibold text-zinc-50">Complete your profile</h1>
          <p className="mt-1 text-sm text-zinc-500">
            We need to verify your business before you can run payroll.
          </p>
        </div>

        <StepIndicator current={step} total={2} />

        <Card>
          <CardContent className="space-y-5 pt-6">
            {step === 1 && (
              <form onSubmit={handleSubmit(submitStep1)} className="space-y-4">
                <Input
                  label="Your Full Name"
                  placeholder="Alex Johnson"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="Company Legal Name"
                  placeholder="Acme Corp Ltd."
                  error={errors.companyName?.message}
                  {...register("companyName")}
                />
                <Select
                  label="Business Type"
                  options={BUSINESS_TYPES}
                  error={errors.businessType?.message}
                  {...register("businessType")}
                />
                <Input
                  label="Contact Person"
                  placeholder="Name of primary contact"
                  error={errors.contactPerson?.message}
                  {...register("contactPerson")}
                />
                {serverError && <p className="text-sm text-red-400">{serverError}</p>}
                <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                  Continue
                </Button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <FileUpload
                  label="Company Proof (Certificate of Incorporation / Business Registration)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={setCompanyProofFile}
                  hint="PDF, JPG or PNG, max 10MB"
                />
                <FileUpload
                  label="ID Verification (National ID / Passport of Director)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={setIdVerifFile}
                  hint="PDF, JPG or PNG, max 10MB"
                />
                {(fileError ?? serverError) && (
                  <p className="text-sm text-red-400">{fileError ?? serverError}</p>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={submitStep2}
                    loading={submitting}
                    className="flex-1"
                    size="lg"
                  >
                    Submit KYB
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
