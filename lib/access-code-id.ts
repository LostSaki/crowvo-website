const ACCESS_CODE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export function isValidAccessCodeId(id: string | null): id is string {
  return typeof id === "string" && ACCESS_CODE_ID_PATTERN.test(id);
}
