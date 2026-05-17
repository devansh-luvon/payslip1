"use client";

import { useRef, useState } from "react";
import { Upload, FileCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  error?: string;
  hint?: string;
}

export function FileUpload({ label, accept, onChange, error, hint }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    setFile(f);
    onChange(f);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-sm font-medium text-zinc-300">{label}</p>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
          dragging ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
        )}
      >
        {file ? (
          <>
            <FileCheck size={24} className="text-emerald-400" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-300">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleFile(null); }}
                className="rounded p-0.5 text-zinc-500 hover:text-zinc-200"
              >
                <X size={14} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Upload size={24} className="text-zinc-500" />
            <div className="text-center">
              <p className="text-sm text-zinc-400">Drop file here or click to browse</p>
              {hint && <p className="mt-0.5 text-xs text-zinc-600">{hint}</p>}
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
