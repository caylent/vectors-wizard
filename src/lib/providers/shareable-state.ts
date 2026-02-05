// Shareable state format for URL encoding
// Allows sharing calculator configurations via base64-encoded URLs

export interface ShareableState {
  v: 1; // Version for future compatibility
  p: string; // Provider ID
  c: Record<string, number>; // Config values
}

/**
 * Encode calculator state to a base64 URL-safe string
 */
export function encodeShareableState(
  providerId: string,
  config: Record<string, number>
): string {
  const state: ShareableState = {
    v: 1,
    p: providerId,
    c: config,
  };

  // Convert to JSON, then base64
  const json = JSON.stringify(state);

  // Use URL-safe base64 encoding
  if (typeof window !== "undefined") {
    return btoa(json)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  // Server-side
  return Buffer.from(json)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decode a base64 URL-safe string to calculator state
 */
export function decodeShareableState(
  encoded: string
): { providerId: string; config: Record<string, number> } | null {
  try {
    // Restore standard base64
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }

    // Decode
    let json: string;
    if (typeof window !== "undefined") {
      json = atob(base64);
    } else {
      json = Buffer.from(base64, "base64").toString("utf-8");
    }

    const state = JSON.parse(json) as ShareableState;

    // Validate version
    if (state.v !== 1) {
      console.warn("Unknown shareable state version:", state.v);
      return null;
    }

    // Validate structure
    if (typeof state.p !== "string" || typeof state.c !== "object") {
      console.warn("Invalid shareable state structure");
      return null;
    }

    return {
      providerId: state.p,
      config: state.c,
    };
  } catch (error) {
    console.warn("Failed to decode shareable state:", error);
    return null;
  }
}

/**
 * Create a full shareable URL
 */
export function createShareableUrl(
  baseUrl: string,
  providerId: string,
  config: Record<string, number>
): string {
  const encoded = encodeShareableState(providerId, config);
  const url = new URL(baseUrl);
  url.searchParams.set("s", encoded);
  return url.toString();
}

/**
 * Parse shareable state from URL search params
 */
export function parseShareableFromUrl(
  searchParams: URLSearchParams
): { providerId: string; config: Record<string, number> } | null {
  const encoded = searchParams.get("s");
  if (!encoded) return null;
  return decodeShareableState(encoded);
}
