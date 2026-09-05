import {
  hashAccessCode,
  isSessionCodeCurrent,
} from "@/lib/access-code";

describe("access code session hash", () => {
  it("accepts a hash for the current code", () => {
    const code = "clan-secret";
    const codeHash = hashAccessCode(code);
    expect(isSessionCodeCurrent(codeHash, code)).toBe(true);
  });

  it("rejects a hash after the access code rotates", () => {
    const oldHash = hashAccessCode("old-code");
    expect(isSessionCodeCurrent(oldHash, "new-code")).toBe(false);
  });
});
