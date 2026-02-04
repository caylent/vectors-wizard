import type { PricingProvider } from "./providers/types";

interface ExportedConfig {
  version: 1;
  provider: string;
  config: Record<string, number>;
  exportedAt: string;
  presetName: string | null;
}

export function exportConfig(
  providerId: string,
  config: Record<string, number>,
  presetName: string | null
): void {
  const data: ExportedConfig = {
    version: 1,
    provider: providerId,
    config,
    exportedAt: new Date().toISOString(),
    presetName,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${providerId}-config.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importConfig(
  file: File,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: PricingProvider<any>
): Promise<{
  success: boolean;
  config?: Record<string, number>;
  presetName?: string | null;
  error?: string;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as ExportedConfig;

    if (data.version !== 1) {
      return { success: false, error: `Unsupported version: ${data.version}` };
    }

    if (data.provider !== provider.id) {
      return {
        success: false,
        error: `Config is for provider "${data.provider}", expected "${provider.id}"`,
      };
    }

    // Validate all keys exist in provider config fields
    const validKeys = new Set(provider.configFields.map((f) => f.key));
    const config: Record<string, number> = {
      ...(provider.defaultConfig as Record<string, number>),
    };

    for (const [key, value] of Object.entries(data.config)) {
      if (validKeys.has(key) && typeof value === "number") {
        config[key] = value;
      }
    }

    return {
      success: true,
      config,
      presetName: data.presetName,
    };
  } catch {
    return { success: false, error: "Invalid JSON file" };
  }
}
