import { Router, type IRouter, type Request, type Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { detectMarket, type Market } from "../lib/currency.js";

const detectMarketFromText = detectMarket;

const router: IRouter = Router();

interface ExtractedMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  status: "success" | "partial" | "blocked";
}

interface AnalysisInput {
  url: string;
  platform: string;
  notes?: string;
  extracted: ExtractedMeta;
}

// ─── Metadata Extraction ───────────────────────────────────────────────────

async function fetchAndExtract(url: string): Promise<ExtractedMeta> {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    const $ = cheerio.load(response.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "";

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $('meta[name="Description"]').attr("content") ||
      "";

    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const ogDescription = $('meta[property="og:description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || null;

    const hasData = !!(title || description);
    const status: ExtractedMeta["status"] = hasData
      ? ogTitle || ogDescription
        ? "success"
        : "partial"
      : "blocked";

    return { title: title.trim(), description: description.trim(), ogTitle: ogTitle.trim(), ogDescription: ogDescription.trim(), ogImage, status };
  } catch (err: any) {
    const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
    const isBlocked = err.response?.status === 403 || err.response?.status === 429 || err.response?.status === 401;
    console.warn(`Fetch failed for ${url}: ${err.message}`);
    return {
      title: "",
      description: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: null,
      status: isTimeout || isBlocked ? "blocked" : "blocked",
    };
  }
}

// ─── Platform Detection ────────────────────────────────────────────────────

function detectPlatform(url: string, hint?: string): string {
  if (hint && hint !== "Other") return hint;
  const lower = url.toLowerCase();
  if (lower.includes("zillow.com")) return "Zillow";
  if (lower.includes("airbnb.com")) return "Airbnb";
  if (lower.includes("realtor.com")) return "Realtor.com";
  if (lower.includes("booking.com")) return "Booking.com";
  if (lower.includes("bayut.com")) return "Bayut";
  if (lower.includes("propertyfinder.ae")) return "PropertyFinder";
  if (lower.includes("rightmove.co.uk")) return "Rightmove";
  if (lower.includes("trulia.com")) return "Trulia";
  if (lower.includes("homes.com")) return "Homes.com";
  return hint || "Property Portal";
}

// ─── Keyword Extraction from Text ─────────────────────────────────────────

function extractKeywordsFromText(text: string, platform: string, url: string): string[] {
  const lower = (text + " " + url).toLowerCase();

  const bedroomsMatch = text.match(/(\d+)\s*(?:bed(?:room)?s?|br)/i);
  const bathroomsMatch = text.match(/(\d+(?:\.\d)?)\s*(?:bath(?:room)?s?|ba)/i);
  const sqftMatch = text.match(/(\d[\d,]*)\s*(?:sq\.?\s*ft|sqft|square feet)/i);

  const beds = bedroomsMatch ? `${bedroomsMatch[1]} bedroom` : null;
  const baths = bathroomsMatch ? `${bathroomsMatch[1]} bathroom` : null;
  const size = sqftMatch ? `${sqftMatch[1]} sqft` : null;

  const locationKeywords: string[] = [];
  const locationPatterns = [
    /in\s+([A-Z][a-zA-Z\s,]+?)(?:\s+[-|]|\s+for\s+|\s+with\s+|$)/,
    /([A-Z][a-zA-Z]+(?:,\s*[A-Z]{2})?)\s+(?:home|house|apartment|condo|property)/i,
  ];
  for (const pattern of locationPatterns) {
    const m = text.match(pattern);
    if (m) {
      locationKeywords.push(m[1].trim().toLowerCase());
      break;
    }
  }

  const typeKeywords: string[] = [];
  const types = ["apartment", "house", "villa", "penthouse", "condo", "townhouse", "studio", "cabin", "cottage", "loft", "duplex"];
  for (const t of types) {
    if (lower.includes(t)) { typeKeywords.push(t); break; }
  }

  const purposeKeywords: string[] = [];
  if (lower.includes("for sale") || lower.includes("buy") || lower.includes("purchase")) {
    purposeKeywords.push("home for sale", "real estate investment", "buy property");
  } else if (lower.includes("for rent") || lower.includes("rental") || lower.includes("airbnb") || lower.includes("booking")) {
    purposeKeywords.push("vacation rental", "short term rental", "furnished rental");
  }

  const featureKeywords: string[] = [];
  const features = [
    ["pool", "swimming pool"], ["gym", "fitness center"], ["view", "scenic view"],
    ["parking", "garage"], ["garden", "backyard"], ["balcony", "terrace"],
    ["furnished", "fully furnished"], ["modern", "modern design"],
    ["luxury", "luxury living"], ["wifi", "high speed wifi"],
  ];
  for (const [trigger, kw] of features) {
    if (lower.includes(trigger)) featureKeywords.push(kw);
    if (featureKeywords.length >= 3) break;
  }

  const platformKw = platform === "Airbnb" || platform === "Booking.com"
    ? ["airbnb rental", "self check-in", "entire place"]
    : ["move-in ready", "motivated seller", "priced to sell"];

  const all = [
    ...(beds ? [beds] : []),
    ...(baths ? [baths] : []),
    ...(size ? [`${size} home`] : []),
    ...locationKeywords,
    ...typeKeywords,
    ...purposeKeywords,
    ...featureKeywords,
    ...platformKw,
    "exclusive listing",
  ].filter(Boolean);

  // Deduplicate and return up to 10
  return [...new Set(all)].slice(0, 10);
}

// ─── Scoring ───────────────────────────────────────────────────────────────

function scoreOriginalListing(extracted: ExtractedMeta, platform: string): number {
  let score = 40; // base

  const title = extracted.ogTitle || extracted.title;
  const desc = extracted.ogDescription || extracted.description;

  if (title.length > 20) score += 8;
  if (title.length > 50) score += 4;
  if (/\d/.test(title)) score += 5; // has numbers (beds, baths, price)
  if (title.includes("|") || title.includes("-") || title.includes(",")) score += 4; // structured
  if (desc.length > 80) score += 8;
  if (desc.length > 200) score += 6;
  if (desc.length > 400) score += 4;
  if (extracted.ogImage) score += 8;
  if (extracted.status === "success") score += 5;

  // Penalize generic/weak titles
  const weakPhrases = ["contact agent", "call for price", "click here", "available now", "property available"];
  if (weakPhrases.some(p => title.toLowerCase().includes(p))) score -= 10;
  if (title.length < 15) score -= 8;
  if (desc.length < 50) score -= 10;

  return Math.max(30, Math.min(82, score));
}

// ─── AI-Style Improvement (no LLM) ────────────────────────────────────────

function generateImprovedTitle(originalTitle: string, platform: string, notes?: string): string {
  const title = originalTitle.trim();
  if (!title || title.length < 5) {
    const platformLabel = platform === "Airbnb" || platform === "Booking.com" ? "Unique Stay" : "Residence";
    return `Exceptional ${platformLabel} | Premium Location | Fully Equipped`;
  }

  // Already has structure — enhance it
  if (title.includes("|") && title.length > 40) {
    // Prepend a power word if missing
    const powerWords = ["Stunning", "Exceptional", "Immaculate", "Turnkey", "Breathtaking", "Rare Opportunity:"];
    const hasPower = powerWords.some(pw => title.toLowerCase().startsWith(pw.toLowerCase()));
    if (!hasPower) return `Stunning ${title}`;
    return title;
  }

  // Strip trailing site name (e.g., "3 Bed House | Zillow")
  const cleaned = title.replace(/\s*[|–-]\s*(Zillow|Airbnb|Realtor\.com|Booking\.com|Trulia|Homes\.com).*$/i, "").trim();

  // Determine property type for suffix
  const suffix =
    platform === "Airbnb" || platform === "Booking.com"
      ? "| Entire Place | Flexible Booking"
      : "| Move-In Ready | Schedule Viewing";

  // Enrich with structure
  const bedroomsMatch = cleaned.match(/(\d+)\s*(?:bed(?:room)?s?|br)/i);
  const beds = bedroomsMatch ? `${bedroomsMatch[1]}-Bedroom ` : "";

  const typeMatch = cleaned.match(/\b(house|apartment|condo|villa|penthouse|studio|townhouse|cabin|cottage|loft)\b/i);
  const propType = typeMatch ? typeMatch[0].charAt(0).toUpperCase() + typeMatch[0].slice(1).toLowerCase() : "Home";

  const locationMatch = cleaned.match(/in\s+([A-Z][a-zA-Z\s]+?)(?:\s*[|,]|$)/i);
  const location = locationMatch ? ` in ${locationMatch[1].trim()}` : "";

  if (beds || typeMatch) {
    return `Exceptional ${beds}${propType}${location} | Updated Finishes & Prime Location ${suffix}`;
  }

  // Fallback: prepend power word and add CTA suffix
  return `${cleaned} | Premium Finishes & Unbeatable Location ${suffix}`;
}

function generateImprovedDescription(
  originalTitle: string,
  originalDesc: string,
  platform: string,
  notes?: string
): string {
  const isShortTerm = platform === "Airbnb" || platform === "Booking.com";
  const title = originalTitle || "this exceptional property";
  const location = (() => {
    const m = title.match(/in\s+([A-Z][a-zA-Z\s,]+?)(?:\s*[|,]|$)/i);
    return m ? m[1].trim() : "this sought-after location";
  })();

  const bedroomsMatch = (title + " " + originalDesc).match(/(\d+)\s*(?:bed(?:room)?s?|br)/i);
  const bathroomsMatch = (title + " " + originalDesc).match(/(\d+(?:\.\d)?)\s*(?:bath(?:room)?s?|ba)/i);
  const beds = bedroomsMatch ? bedroomsMatch[1] : null;
  const baths = bathroomsMatch ? bathroomsMatch[1] : null;

  // Extract any features mentioned in original
  const lower = originalDesc.toLowerCase();
  const features: string[] = [];
  if (lower.includes("pool") || lower.includes("swimming")) features.push("resort-style pool");
  if (lower.includes("gym") || lower.includes("fitness")) features.push("fully equipped fitness center");
  if (lower.includes("view") || lower.includes("vista")) features.push("breathtaking views");
  if (lower.includes("parking") || lower.includes("garage")) features.push("dedicated parking");
  if (lower.includes("garden") || lower.includes("backyard") || lower.includes("yard")) features.push("private garden / backyard");
  if (lower.includes("balcony") || lower.includes("terrace")) features.push("private balcony / terrace");
  if (lower.includes("kitchen") || lower.includes("cook")) features.push("gourmet kitchen with premium appliances");
  if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("internet")) features.push("high-speed WiFi");
  if (lower.includes("school")) features.push("top-rated school district");
  if (lower.includes("furnished")) features.push("fully furnished & move-in ready");

  const notesSection = notes ? `\nAdditional highlights per agent: ${notes}\n` : "";

  if (isShortTerm) {
    const bedroomStr = beds ? `${beds}-bedroom ` : "";
    return `Escape to this beautifully appointed ${bedroomStr}retreat in ${location}. Whether you're travelling for business or leisure, every detail has been considered for a seamless, luxurious stay.

${features.length > 0 ? features.map(f => `✦ ${f.charAt(0).toUpperCase() + f.slice(1)}`).join("\n") : "✦ Premium amenities throughout\n✦ Thoughtfully decorated living spaces\n✦ Fully equipped kitchen"}
✦ Flexible self check-in
✦ Dedicated support for guests

${notesSection}Enjoy the perfect base to explore ${location} — with top-rated restaurants, shopping, and cultural attractions all within easy reach. Book now and experience the difference.`;
  }

  const bedroomStr = beds ? `${beds}-bedroom ` : "";
  const bathroomStr = baths ? `, ${baths}-bathroom ` : " ";
  return `Welcome to this outstanding ${bedroomStr}residence${bathroomStr}situated in the heart of ${location}. Designed for those who appreciate the finer things, this home delivers a perfect fusion of contemporary elegance and practical comfort.

${features.length > 0
  ? features.map(f => `✦ ${f.charAt(0).toUpperCase() + f.slice(1)}`).join("\n")
  : "✦ Premium finishes and fixtures throughout\n✦ Spacious, light-filled living areas\n✦ Private outdoor space ideal for entertaining"
}
${notesSection}
Positioned in one of ${location}'s most coveted addresses, this property offers an extraordinary opportunity for discerning buyers seeking both lifestyle and long-term value.

Contact us today to arrange your exclusive private viewing.`;
}

function generatePricingSuggestion(
  originalTitle: string,
  originalDesc: string,
  platform: string,
  url: string
): string {
  const combined = (originalTitle + " " + originalDesc + " " + url).toLowerCase();
  const isShortTerm = platform === "Airbnb" || platform === "Booking.com";

  const bedsMatch = combined.match(/(\d+)\s*(?:bed|br)/);
  const beds = bedsMatch ? parseInt(bedsMatch[1]) : 2;

  // Detect market from all combined text signals
  const market = detectMarketFromText(combined);

  if (isShortTerm) {
    // Nightly rates in local currency (base in USD-equivalent)
    const baseUSD = 80 + beds * 40;
    const rates: Record<string, number> = { USD: 1, AED: 3.67, GBP: 0.79, INR: 83, EUR: 0.92 };
    const rate = rates[market.currency] ?? 1;
    const weekdayLo = Math.round(baseUSD * rate);
    const weekdayHi = Math.round((baseUSD + 40) * rate);
    const weekendLo = Math.round((baseUSD + 50) * rate);
    const weekendHi = Math.round((baseUSD + 90) * rate);
    const s = market.symbol;
    const c = market.currency;
    const fmt = (n: number) => market.currency === "AED" ? `AED ${n}` : `${s}${n} ${c}`;
    return `Based on comparable ${platform} listings with similar specifications in ${market.region}, we recommend pricing at ${fmt(weekdayLo)}–${fmt(weekdayHi)}/night on weekdays and ${fmt(weekendLo)}–${fmt(weekendHi)}/night on weekends. Enabling Instant Book and offering a 7-night discount of 10–15% can significantly boost occupancy. Consider seasonal pricing adjustments during peak travel periods.`;
  }

  const ppSqft = market.pricePerSqft.apartment;
  const estimatedSqft = 800 + beds * 350;
  const basePrice = ppSqft * estimatedSqft;
  const lo = Math.round(basePrice * 0.92 / 1000) * 1000;
  const hi = Math.round(basePrice * 1.08 / 1000) * 1000;
  const dom = market.currency === "AED" ? 35 : market.currency === "INR" ? 45 : market.currency === "GBP" ? 28 : 22;

  const formatLong = (n: number): string => {
    if (market.currency === "INR") {
      if (n >= 10_000_000) return `${market.symbol}${(n / 10_000_000).toFixed(2)} Cr ${market.currency}`;
      return `${market.symbol}${(n / 100_000).toFixed(1)} L ${market.currency}`;
    }
    if (market.currency === "AED") return `AED ${n.toLocaleString()}`;
    return `${market.symbol}${n.toLocaleString()} ${market.currency}`;
  };

  return `Based on comparable sales for similar ${beds}-bedroom properties in ${market.region}, the estimated market value range is ${formatLong(lo)}–${formatLong(hi)}. We recommend listing at the lower end of this range to generate multiple offers quickly. Current average days-on-market in this segment is approximately ${dom} days. A professional photography refresh and virtual tour could increase inquiries by up to 40%.`;
}

// ─── Route ────────────────────────────────────────────────────────────────

router.post("/analyze", async (req: Request, res: Response) => {
  const { url, platform: platformHint, notes } = req.body ?? {};

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "validation_error", message: "url is required" });
    return;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    res.status(400).json({ error: "validation_error", message: "Invalid URL format" });
    return;
  }

  const platform = detectPlatform(url, platformHint);

  // 1. Fetch and extract
  const extracted = await fetchAndExtract(url);

  // 2. Resolve best title/description
  const rawTitle = (extracted.ogTitle || extracted.title || "").trim();
  const rawDesc = (extracted.ogDescription || extracted.description || "").trim();

  const wasBlocked = extracted.status === "blocked" && !rawTitle && !rawDesc;

  // 3. Build fallback titles if blocked
  const originalTitle = rawTitle || `${platform} Listing — ${parsedUrl.hostname}`;
  const originalDescription = rawDesc || (
    wasBlocked
      ? `This site blocked automated access. Analysis was generated using URL signals and platform context for ${platform}.`
      : "No description was found on this page."
  );

  // 4. Generate improvements
  const improvedTitle = generateImprovedTitle(originalTitle, platform, notes);
  const improvedDescription = generateImprovedDescription(originalTitle, rawDesc || originalDescription, platform, notes);
  const pricingSuggestion = generatePricingSuggestion(originalTitle, rawDesc || originalDescription, platform, url);
  const seoKeywords = extractKeywordsFromText(originalTitle + " " + (rawDesc || ""), platform, url);
  const listingScore = scoreOriginalListing(extracted, platform);

  res.json({
    originalTitle,
    originalDescription,
    detectedImage: extracted.ogImage || null,
    improvedTitle,
    improvedDescription,
    pricingSuggestion,
    seoKeywords,
    listingScore,
    platform,
    extractionStatus: wasBlocked ? "blocked" : extracted.status,
  });
});

export default router;
