import { describe, expect, it } from "vitest";
import { isBlockedAddress } from "./safeUrl";

describe("public URL network boundaries", () => {
  it.each([
    "127.0.0.1",
    "10.2.3.4",
    "100.64.1.2",
    "169.254.169.254",
    "172.31.2.4",
    "192.168.1.1",
    "198.51.100.4",
    "::1",
    "fd00::1",
    "fe80::1",
    "2001:db8::1",
  ])("blocks %s", (address) => expect(isBlockedAddress(address)).toBe(true));
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "allows public address %s",
    (address) => expect(isBlockedAddress(address)).toBe(false),
  );
  it("rejects malformed address values", () =>
    expect(isBlockedAddress("not-an-ip")).toBe(true));
});
