import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";

const MAX_BYTES = 2_000_000;
function ipv4Number(ip: string) {
  return (
    ip.split(".").reduce((value, part) => (value << 8) + Number(part), 0) >>> 0
  );
}
function inIpv4Range(ip: string, base: string, bits: number) {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4Number(ip) & mask) === (ipv4Number(base) & mask);
}

export function isBlockedAddress(raw: string) {
  const ip = raw.toLowerCase().replace(/^::ffff:/, "");
  if (isIP(ip) === 4)
    return [
      ["0.0.0.0", 8],
      ["10.0.0.0", 8],
      ["100.64.0.0", 10],
      ["127.0.0.0", 8],
      ["169.254.0.0", 16],
      ["172.16.0.0", 12],
      ["192.0.0.0", 24],
      ["192.0.2.0", 24],
      ["192.168.0.0", 16],
      ["198.18.0.0", 15],
      ["198.51.100.0", 24],
      ["203.0.113.0", 24],
      ["224.0.0.0", 4],
      ["240.0.0.0", 4],
    ].some(([base, bits]) => inIpv4Range(ip, String(base), Number(bits)));
  if (isIP(ip) !== 6) return true;
  return (
    ip === "::" ||
    ip === "::1" ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    /^fe[89ab]/.test(ip) ||
    ip.startsWith("ff") ||
    ip.startsWith("2001:db8:")
  );
}

async function resolvePublicUrl(raw: string) {
  const url = new URL(raw);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Only credential-free public HTTP(S) URLs are accepted.");
  const addresses = await lookup(url.hostname, { all: true });
  if (
    !addresses.length ||
    addresses.some(({ address }) => isBlockedAddress(address))
  )
    throw new Error(
      "Private, local, or reserved network destinations are blocked.",
    );
  return { url, address: addresses[0] };
}

function requestOnce(url: URL, address: { address: string; family: number }) {
  return new Promise<{
    status: number;
    location?: string;
    contentType: string;
    body: string;
  }>((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
      if (options.all) callback(null, [{ address: address.address, family: address.family }]);
      else callback(null, address.address, address.family);
    };
    const request = transport.request(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": "InternGuard/1.0 public listing analyzer",
          Accept: "text/html,text/plain",
        },
        lookup: pinnedLookup,
      },
      (response) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        response.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > MAX_BYTES)
            request.destroy(
              new Error("The webpage is too large to analyze safely."),
            );
          else chunks.push(chunk);
        });
        response.on("end", () =>
          resolve({
            status: response.statusCode ?? 500,
            location: response.headers.location,
            contentType: String(response.headers["content-type"] ?? ""),
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    request.setTimeout(9000, () =>
      request.destroy(new Error("The webpage took too long to respond.")),
    );
    request.on("error", reject);
    request.end();
  });
}

export async function retrievePublicPage(raw: string) {
  let current = raw;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const { url, address } = await resolvePublicUrl(current);
    const response = await requestOnce(url, address);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (!response.location)
        throw new Error("The webpage returned an invalid redirect.");
      current = new URL(response.location, url).toString();
      continue;
    }
    if (response.status < 200 || response.status >= 300)
      throw new Error(`The webpage returned HTTP ${response.status}.`);
    if (!/(text\/html|text\/plain)/i.test(response.contentType))
      throw new Error("The URL did not return readable webpage content.");
    return { body: response.body, finalUrl: url.toString() };
  }
  throw new Error("The webpage redirected too many times.");
}
