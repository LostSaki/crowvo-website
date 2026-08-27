const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}
