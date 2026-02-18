"use client";

import { listProviders } from "@/lib/providers/registry";

interface ProviderSelectorProps {
  currentProviderId: string;
  onProviderChange: (providerId: string) => void;
}

export function ProviderSelector({
  currentProviderId,
  onProviderChange,
}: ProviderSelectorProps) {
  const providers = listProviders();

  return (
    <div className="border-b border-border/50 bg-background">
      <div className="mx-auto max-w-[1320px] px-6 py-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <span className="shrink-0 text-xs font-medium uppercase tracking-[0.15em] text-muted">
            Provider
          </span>
          <div className="flex items-center gap-1.5">
            {providers.map((provider) => {
              const isActive = provider.id === currentProviderId;
              return (
                <button
                  key={provider.id}
                  onClick={() => onProviderChange(provider.id)}
                  title={provider.description}
                  className={`shrink-0 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "border border-[#8555f0]/50 bg-[#8555f0]/15 text-[#8555f0]"
                      : "border border-border bg-surface text-text-secondary hover:border-text-secondary/30 hover:text-text-primary"
                  }`}
                >
                  {provider.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
