"use client";

import { useRef, useState } from "react";

export function ConfigToolbar({
  onExport,
  onImport,
  onReset,
}: {
  onExport: () => void;
  onImport: (file: File) => Promise<{ success: boolean; error?: string }>;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

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

  return (
    <div className="mb-6 flex items-center gap-2">
      <button
        onClick={onExport}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
      >
        Export
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
      >
        Import
      </button>
      <button
        onClick={onReset}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
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
