import assert from "node:assert/strict";
import test from "node:test";

import { isValidAccessCodeId } from "../lib/access-code-id.ts";

test("accepts URL-safe access code ids", () => {
  assert.equal(isValidAccessCodeId("abc123"), true);
  assert.equal(isValidAccessCodeId("code_ABC-123"), true);
});

test("rejects traversal and path-like access code ids", () => {
  for (const id of [
    "",
    ".",
    "..",
    "../users",
    "../../auth/signup",
    "abc/def",
    "abc\\def",
    "%2e%2e",
    "abc def",
  ]) {
    assert.equal(isValidAccessCodeId(id), false, id);
  }
});

test("rejects missing or oversized access code ids", () => {
  assert.equal(isValidAccessCodeId(null), false);
  assert.equal(isValidAccessCodeId("a".repeat(129)), false);
});
