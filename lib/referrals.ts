const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8) {
  const values = new Uint32Array(length);
  globalThis.crypto?.getRandomValues(values);

  let code = "";
  for (let i = 0; i < length; i += 1) {
    const value = values[i] || Math.floor(Math.random() * CHARS.length);
    code += CHARS[value % CHARS.length];
  }
  return code;
}
