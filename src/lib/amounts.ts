type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "AED"
  | "KWD"
  | "CHF"
  | "JPY"
  | "GBP"
  | "CAD"
  | "AUD"
  | "SGD"
  | "CNY"
  | "HKD"
  | "SAR"
  | "QAR"
  | "OMR"
  | "BHD"
  | "NZD";

const currencyAliases = [
  "indian\\s+rupees?",
  "american\\s+dollars?",
  "us\\s+dollars?",
  "uae\\s+dirhams?",
  "emirati\\s+dirhams?",
  "kuwaiti\\s+dinars?",
  "swiss\\s+francs?",
  "japanese\\s+yen",
  "pounds?\\s+sterling",
  "british\\s+pounds?",
  "canadian\\s+dollars?",
  "australian\\s+dollars?",
  "singapore\\s+dollars?",
  "hong\\s+kong\\s+dollars?",
  "new\\s+zealand\\s+dollars?",
  "saudi\\s+riyals?",
  "qatari\\s+riyals?",
  "omani\\s+rials?",
  "bahraini\\s+dinars?",
  "rupees?",
  "dollars?",
  "euros?",
  "dirhams?",
  "francs?",
  "pounds?",
  "yen",
  "yuan",
  "inr",
  "usd",
  "eur",
  "aed",
  "kwd",
  "chf",
  "jpy",
  "gbp",
  "cad",
  "aud",
  "sgd",
  "cny",
  "rmb",
  "hkd",
  "sar",
  "qar",
  "omr",
  "bhd",
  "nzd",
  "rs\\.?",
  "us\\$",
  "₹",
  "\\$",
  "€",
  "£",
  "¥",
  "د\\.?إ",
  "د\\.?ك",
].join("|");

const amountNumber =
  "((?:\\d{1,3}(?:[,\\s]\\d{2,3})+|\\d+)(?:\\.\\d{1,2})?)";
const cadence =
  "(?:\\s*(per\\s+(?:month|week|year|day)|monthly|weekly|annually|yearly|/\\s*(?:month|week|year|day)))?";
const prefixPattern = new RegExp(
  `(${currencyAliases})\\s*${amountNumber}${cadence}`,
  "gi",
);
const suffixPattern = new RegExp(
  `${amountNumber}\\s*(${currencyAliases})${cadence}`,
  "gi",
);

function currencyCode(token: string): CurrencyCode | null {
  const value = token.toLowerCase().replaceAll(".", "").trim();
  if (/₹|^rs$|^inr$|(?:indian\s+)?rupees?/.test(value)) return "INR";
  if (/^us\$$|^\$$|^usd$|^(?:american\s+|us\s+)?dollars?$/.test(value))
    return "USD";
  if (/^€$|^eur$|^euros?$/.test(value)) return "EUR";
  if (/^aed$|^دإ$|^(?:(?:uae|emirati)\s+)?dirhams?$/.test(value))
    return "AED";
  if (/^kwd$|^دك$|^kuwaiti\s+dinars?$/.test(value)) return "KWD";
  if (/^chf$|^(?:swiss\s+)?francs?$/.test(value)) return "CHF";
  if (/^¥$|^jpy$|^(?:japanese\s+)?yen$/.test(value)) return "JPY";
  if (/^£$|^gbp$|^(?:british\s+)?pounds?$|^pounds?\s+sterling$/.test(value))
    return "GBP";
  if (/^cad$|^canadian\s+dollars?$/.test(value)) return "CAD";
  if (/^aud$|^australian\s+dollars?$/.test(value)) return "AUD";
  if (/^sgd$|^singapore\s+dollars?$/.test(value)) return "SGD";
  if (/^(?:cny|rmb|yuan)$/.test(value)) return "CNY";
  if (/^hkd$|^hong\s+kong\s+dollars?$/.test(value)) return "HKD";
  if (/^sar$|^saudi\s+riyals?$/.test(value)) return "SAR";
  if (/^qar$|^qatari\s+riyals?$/.test(value)) return "QAR";
  if (/^omr$|^omani\s+rials?$/.test(value)) return "OMR";
  if (/^bhd$|^bahraini\s+dinars?$/.test(value)) return "BHD";
  if (/^nzd$|^new\s+zealand\s+dollars?$/.test(value)) return "NZD";
  return null;
}

function formattedAmount(code: CurrencyCode, amount: number) {
  const locale = code === "INR" ? "en-IN" : "en-US";
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(amount);
  const symbol: Partial<Record<CurrencyCode, string>> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };
  return symbol[code] ? `${symbol[code]}${number}` : `${code} ${number}`;
}

function cadenceSuffix(value?: string) {
  if (!value) return "";
  const period = value.toLowerCase().replace(/\s+/g, " ");
  if (/month|monthly/.test(period)) return " / month";
  if (/week|weekly/.test(period)) return " / week";
  if (/year|annual|yearly/.test(period)) return " / year";
  if (/day/.test(period)) return " / day";
  return "";
}

/** Repairs a known PDF/OCR failure where an unsupported rupee glyph becomes I. */
export function normalizeCurrencyText(text: string) {
  return text.replace(/\bI(?=\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?\b)/g, "INR ");
}

export function normalizeMonetaryMentions(input: string | string[]) {
  const source = (Array.isArray(input) ? input : [input]).map(
    normalizeCurrencyText,
  );
  const values: string[] = [];
  const add = (currency: string, rawAmount: string, rawCadence?: string) => {
    const code = currencyCode(currency);
    const amount = Number(rawAmount.replace(/[\s,]/g, ""));
    if (!code || !Number.isFinite(amount) || amount < 10) return;
    values.push(formattedAmount(code, amount) + cadenceSuffix(rawCadence));
  };

  for (const text of source) {
    for (const match of text.matchAll(prefixPattern))
      add(match[1], match[2], match[3]);
    for (const match of text.matchAll(suffixPattern))
      add(match[2], match[1], match[3]);
  }

  const unique = [...new Set(values)];
  return unique.length ? unique : ["None detected"];
}

export const currencyAmountPattern = new RegExp(
  `(?:${currencyAliases})\\s*${amountNumber}|${amountNumber}\\s*(?:${currencyAliases})`,
  "i",
);
