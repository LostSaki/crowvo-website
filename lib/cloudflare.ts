type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(token?: string, ip?: string) {
  if (!process.env.CLOUDFLARE_TURNSTILE_SECRET) {
    return { success: true, errors: [] as string[] };
  }

  if (!token) {
    return { success: false, errors: ["missing-input-response"] };
  }

  const body = new URLSearchParams();
  body.set("secret", process.env.CLOUDFLARE_TURNSTILE_SECRET);
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
