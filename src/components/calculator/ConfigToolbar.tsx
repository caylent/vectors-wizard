"use client";

import { useEffect, useRef, useState } from "react";

export function ConfigToolbar({
  onExport,
  onImport,
  onReset,
  onShare,
}: {
  onExport: () => void;
  onImport: (file: File) => Promise<{ success: boolean; error?: string }>;
  onReset: () => void;
  onShare?: () => string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-clear "Copied!" with cleanup on unmount
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const result = await onImport(file);
    if (!result.success) {
      setImportError(result.error ?? "Import failed");
    }

    // Reset input so the same file can be re-imported
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleShare = async () => {
    if (!onShare) return;
    const url = onShare();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  return (
    <div className="mb-8 flex items-center gap-2">
      {onShare && (
        <button
          onClick={handleShare}
          className="rounded-[4px] border border-[#8555f0]/50 bg-[#8555f0]/10 px-3 py-1.5 text-xs font-medium text-[#8555f0] transition-all duration-200 hover:bg-[#8555f0]/20"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      )}
      <button
        onClick={onExport}
        className="rounded-[4px] border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-text-secondary/30 hover:text-text-primary"
      >
        Export
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="rounded-[4px] border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-text-secondary/30 hover:text-text-primary"
      >
        Import
      </button>
      <button
        onClick={onReset}
        className="rounded-[4px] border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-text-secondary/30 hover:text-text-primary"
      >
        Reset
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      {importError && (
        <span className="text-xs text-red-400">{importError}</span>
      )}
    </div>
  );
}
