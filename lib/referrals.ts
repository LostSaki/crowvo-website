import { randomInt } from "node:crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CHARS[randomInt(CHARS.length)];
  }
  return code;
}
