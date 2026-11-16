const ALLOWED_HOSTS = new Set(["running-coach.uk", "www.running-coach.uk", "example.com", "www.example.com"]);

/** Allow only https destinations on an allowlisted host — prevents open redirects. */
export function isSafePartnerDestination(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
