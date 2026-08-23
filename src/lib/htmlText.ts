const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

export function decodeHtmlEntities(value: string) {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|([a-z][\da-z]+));/gi,
    (entity, decimal: string, hexadecimal: string, named: string) => {
      if (named) return namedEntities[named.toLowerCase()] ?? entity;
      const point = Number.parseInt(
        decimal || hexadecimal,
        hexadecimal ? 16 : 10,
      );
      if (!Number.isFinite(point) || point < 0 || point > 0x10ffff)
        return entity;
      try {
        return String.fromCodePoint(point);
      } catch {
        return entity;
      }
    },
  );
}

function cleanHtmlText(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

export function visibleHtmlText(html: string, maximum = 20_000) {
  return cleanHtmlText(
    html
      .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, " ")
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  ).slice(0, maximum);
}

export function htmlPageTitle(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1];
  return title
    ? cleanHtmlText(title.replace(/<[^>]+>/g, " ")).slice(0, 180)
    : undefined;
}
