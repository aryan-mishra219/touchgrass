/**
 * Dynamic API Base URL resolver.
 * Handles:
 * - Server-side rendering fallback
 * - Configured NEXT_PUBLIC_API_URL
 * - Dynamic LAN IP/hostname resolution when accessed from a phone/tablet over Wi-Fi
 */
export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  // If explicitly set to a production or tunnel URL (not localhost), use it
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  // When opened via phone or projector via LAN (e.g. 192.168.1.5:3000),
  // route requests to that same host on port 8000
  const hostname = window.location.hostname || "localhost";
  return `http://${hostname}:8000`;
}
