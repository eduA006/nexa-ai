import { describe, it, expect } from "vitest";
import { isPrivateOrLoopbackIp, assertSafeExternalUrl } from "@/lib/citations/lookup";

describe("isPrivateOrLoopbackIp", () => {
  it.each([
    ["127.0.0.1", true],
    ["10.0.0.5", true],
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["172.32.0.1", false],
    ["192.168.1.1", true],
    ["169.254.169.254", true], // metadata de nube
    ["8.8.8.8", false],
    ["93.184.216.34", false],
    ["::1", true],
    ["fe80::1", true],
    ["fd00::1", true],
    ["2001:4860:4860::8888", false],
  ])("%s -> %s", (ip, expected) => {
    expect(isPrivateOrLoopbackIp(ip)).toBe(expected);
  });
});

describe("assertSafeExternalUrl", () => {
  it("rechaza esquemas distintos de http/https", async () => {
    await expect(assertSafeExternalUrl("javascript:alert(1)")).rejects.toThrow(
      /http o https/,
    );
    await expect(assertSafeExternalUrl("file:///etc/passwd")).rejects.toThrow(
      /http o https/,
    );
  });

  it("rechaza URLs inválidas", async () => {
    await expect(assertSafeExternalUrl("no-es-una-url")).rejects.toThrow(/inválida/);
  });

  it("rechaza localhost por nombre", async () => {
    await expect(assertSafeExternalUrl("http://localhost:3000")).rejects.toThrow(
      /locales/,
    );
    await expect(assertSafeExternalUrl("http://foo.localhost")).rejects.toThrow(
      /locales/,
    );
  });

  it("rechaza IPs privadas/loopback dadas directamente", async () => {
    await expect(assertSafeExternalUrl("http://127.0.0.1")).rejects.toThrow(/privadas/);
    await expect(assertSafeExternalUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow(
      /privadas/,
    );
    await expect(assertSafeExternalUrl("http://10.0.0.1")).rejects.toThrow(/privadas/);
  });

  it("acepta una IP pública dada directamente", async () => {
    await expect(assertSafeExternalUrl("http://8.8.8.8")).resolves.toBeInstanceOf(URL);
  });
});
