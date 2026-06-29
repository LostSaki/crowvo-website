type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(token?: string, ip?: string) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;
  if (!secret) {
    const turnstileIsUnconfigured =
      process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!turnstileIsUnconfigured) {
      return { success: false, errors: ["missing-input-secret"] };
    }
    return { success: true, errors: [] as string[] };
  }

  if (!token) {
    return { success: false, errors: ["missing-input-response"] };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) {
    body.set("remoteip", ip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = (await response.json()) as TurnstileResponse;

  return { success: data.success, errors: data["error-codes"] ?? [] };
}
