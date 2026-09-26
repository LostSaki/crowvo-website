const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CHARS[values[i] % CHARS.length];
  }
  return code;
}
