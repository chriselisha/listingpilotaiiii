export type CurrencyCode = "USD" | "AED" | "GBP" | "INR" | "EUR";

export interface Market {
  currency: CurrencyCode;
  symbol: string;
  region: string;
  pricePerSqft: {
    studio: number;
    apartment: number;
    villa: number;
    penthouse: number;
    townhouse: number;
    office: number;
    retail: number;
  };
  rentYield: { min: number; max: number };
}

const MARKETS: Record<CurrencyCode, Market> = {
  AED: {
    currency: "AED",
    symbol: "AED",
    region: "UAE",
    pricePerSqft: {
      studio: 900,
      apartment: 1200,
      villa: 1800,
      penthouse: 3500,
      townhouse: 1400,
      office: 1000,
      retail: 1100,
    },
    rentYield: { min: 0.065, max: 0.08 },
  },
  GBP: {
    currency: "GBP",
    symbol: "£",
    region: "UK",
    pricePerSqft: {
      studio: 350,
      apartment: 500,
      villa: 800,
      penthouse: 1500,
      townhouse: 650,
      office: 400,
      retail: 450,
    },
    rentYield: { min: 0.04, max: 0.06 },
  },
  INR: {
    currency: "INR",
    symbol: "₹",
    region: "India",
    pricePerSqft: {
      studio: 5000,
      apartment: 8000,
      villa: 15000,
      penthouse: 25000,
      townhouse: 12000,
      office: 7000,
      retail: 9000,
    },
    rentYield: { min: 0.02, max: 0.03 },
  },
  EUR: {
    currency: "EUR",
    symbol: "€",
    region: "Europe",
    pricePerSqft: {
      studio: 280,
      apartment: 400,
      villa: 600,
      penthouse: 1200,
      townhouse: 500,
      office: 350,
      retail: 380,
    },
    rentYield: { min: 0.04, max: 0.055 },
  },
  USD: {
    currency: "USD",
    symbol: "$",
    region: "USA",
    pricePerSqft: {
      studio: 200,
      apartment: 250,
      villa: 350,
      penthouse: 700,
      townhouse: 300,
      office: 220,
      retail: 260,
    },
    rentYield: { min: 0.05, max: 0.07 },
  },
};

const KEYWORDS: Array<{ patterns: string[]; currency: CurrencyCode }> = [
  {
    patterns: [
      "dubai", "abu dhabi", "sharjah", "ajman", "ras al khaimah",
      "fujairah", "umm al quwain", "uae", "united arab emirates", "emirates",
      "palm jumeirah", "downtown dubai", "dubai marina", "business bay",
      "jbr", "jumeirah", "deira", "bur dubai", "al barsha", "mirdif",
      "discovery gardens", "international city", "silicon oasis",
      "motor city", "sports city", "arabian ranches",
    ],
    currency: "AED",
  },
  {
    patterns: [
      "london", "manchester", "birmingham", "leeds", "liverpool",
      "edinburgh", "glasgow", "bristol", "nottingham", "sheffield",
      "uk", "united kingdom", "england", "scotland", "wales",
      "north ireland", "cambridge", "oxford", "bath", "york", "leicester",
    ],
    currency: "GBP",
  },
  {
    patterns: [
      "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad",
      "chennai", "kolkata", "pune", "ahmedabad", "jaipur",
      "india", "surat", "lucknow", "kanpur", "nagpur", "noida",
      "gurgaon", "gurugram", "chandigarh", "bhopal", "patna",
    ],
    currency: "INR",
  },
  {
    patterns: [
      "paris", "berlin", "barcelona", "madrid", "rome", "milan",
      "amsterdam", "brussels", "vienna", "lisbon", "prague", "warsaw",
      "budapest", "munich", "frankfurt", "hamburg", "cologne",
      "france", "germany", "spain", "italy", "netherlands", "belgium",
      "austria", "portugal", "greece", "sweden", "norway", "denmark",
      "finland", "switzerland", "zürich", "zurich", "geneva",
    ],
    currency: "EUR",
  },
];

export function detectMarket(location: string): Market {
  const lower = location.toLowerCase();
  for (const { patterns, currency } of KEYWORDS) {
    if (patterns.some((p) => lower.includes(p))) {
      return MARKETS[currency];
    }
  }
  return MARKETS["USD"];
}

export function formatPrice(amount: number, market: Market): string {
  const { currency, symbol } = market;
  let formatted: string;

  if (currency === "INR") {
    // Indian number system: lakhs and crores
    if (amount >= 10_000_000) {
      formatted = `${symbol}${(amount / 10_000_000).toFixed(2)} Cr`;
    } else if (amount >= 100_000) {
      formatted = `${symbol}${(amount / 100_000).toFixed(2)} L`;
    } else {
      formatted = `${symbol}${amount.toLocaleString("en-IN")}`;
    }
    return `${formatted} ${currency}`;
  }

  if (currency === "AED") {
    if (amount >= 1_000_000) {
      formatted = `${(amount / 1_000_000).toFixed(2)}M`;
    } else {
      formatted = `${(amount / 1_000).toFixed(0)}K`;
    }
    return `AED ${formatted}`;
  }

  // GBP, EUR, USD
  if (amount >= 1_000_000) {
    formatted = `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  } else if (amount >= 1_000) {
    formatted = `${symbol}${(amount / 1_000).toFixed(0)}K`;
  } else {
    formatted = `${symbol}${amount}`;
  }
  return `${formatted} ${currency}`;
}

export function formatRent(amount: number, market: Market): string {
  const { currency, symbol } = market;

  if (currency === "INR") {
    if (amount >= 100_000) {
      return `${symbol}${(amount / 100_000).toFixed(1)} L ${currency}/month`;
    }
    return `${symbol}${amount.toLocaleString("en-IN")} ${currency}/month`;
  }

  if (currency === "AED") {
    if (amount >= 1_000_000) {
      return `AED ${(amount / 1_000_000).toFixed(2)}M/year`;
    }
    return `AED ${amount.toLocaleString()}/month`;
  }

  if (amount >= 1_000) {
    return `${symbol}${(amount / 1_000).toFixed(1)}K ${currency}/month`;
  }
  return `${symbol}${amount} ${currency}/month`;
}

export function pricingContextForMarket(market: Market): string {
  switch (market.currency) {
    case "AED":
      return "Dubai and the UAE real estate market";
    case "GBP":
      return "the UK property market";
    case "INR":
      return "the Indian real estate market";
    case "EUR":
      return "the European property market";
    default:
      return "the US real estate market";
  }
}
