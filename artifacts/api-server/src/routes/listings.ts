import { Router, type IRouter, type Request, type Response } from "express";
import { GenerateListingBody, GenerateListingResponse } from "@workspace/api-zod";
import { detectMarket, formatPrice, formatRent, type Market } from "../lib/currency.js";

const router: IRouter = Router();

function generateMockListing(data: {
  location: string;
  propertyType: string;
  listingPurpose: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqft: number;
  amenities?: string;
}) {
  const market = detectMarket(data.location);
  const currency = market.currency;
  const bedroomLabel = data.bedrooms === 0 ? "Studio" : `${data.bedrooms}-Bedroom`;
  const amenityList = data.amenities
    ? data.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  const amenityStr =
    amenityList.length > 0
      ? amenityList.slice(0, 4).join(", ")
      : "premium amenities";

  const featuredAmenity = amenityList[0] || "stunning views";

  const title = `${bedroomLabel} ${data.propertyType} for ${data.listingPurpose === "sale" ? "Sale" : "Rent"} in ${data.location} | ${data.sizeSqft.toLocaleString()} Sqft | ${featuredAmenity}`;

  const description = `Discover this exceptional ${bedroomLabel.toLowerCase()} ${data.propertyType.toLowerCase()} nestled in the heart of ${data.location}. Spanning an impressive ${data.sizeSqft.toLocaleString()} square feet, this residence offers ${data.bathrooms} elegantly appointed bathroom${data.bathrooms !== 1 ? "s" : ""} and a thoughtfully designed layout perfect for modern living.

${amenityList.length > 0 ? `Residents enjoy access to world-class amenities including ${amenityList.join(", ")}, ensuring a lifestyle of unparalleled comfort and convenience.` : "The property comes with a suite of premium amenities designed to elevate everyday living."}

Situated in one of ${data.location.split(",")[0]}'s most sought-after addresses, this property represents an extraordinary opportunity ${data.listingPurpose === "sale" ? "to own a prestigious home" : "to lease a distinguished residence"} that combines luxury, location, and lasting value.

Contact us today to schedule your private viewing.`;

  const instagramCaption = `✨ ${bedroomLabel} ${data.propertyType} ${data.listingPurpose === "sale" ? "For Sale" : "For Rent"} in ${data.location} 🏡

${data.sizeSqft.toLocaleString()} Sqft | ${data.bedrooms} Bed | ${data.bathrooms} Bath
${amenityList.length > 0 ? amenityList.slice(0, 3).join(" • ") + " ✦" : "Premium Amenities ✦"}

This stunning property is the definition of luxury living. Every detail has been crafted for those who expect nothing but the best.

📩 DM us to schedule a private viewing
🔗 Link in bio for more details

#RealEstate #LuxuryLiving #${data.propertyType.replace(/\s+/g, "")} #${data.location.split(",")[0].replace(/\s+/g, "")}`;

  const locationTag = data.location.split(",")[0].replace(/\s+/g, "");
  const regionHashtag =
    currency === "AED" ? "DubaiRealEstate"
    : currency === "GBP" ? "UKProperty"
    : currency === "INR" ? "IndiaRealEstate"
    : currency === "EUR" ? "EuropeProperty"
    : "USARealEstate";

  const hashtags = [
    `#${locationTag}RealEstate`,
    `#Luxury${data.propertyType.replace(/\s+/g, "")}`,
    `#${data.listingPurpose === "sale" ? "HomeForSale" : "PropertyForRent"}`,
    `#RealEstateAgent`,
    `#LuxuryLiving`,
    `#${locationTag}Properties`,
    `#${bedroomLabel.replace(/\s+/g, "")}${data.propertyType.replace(/\s+/g, "")}`,
    `#PropertyInvestment`,
    `#${regionHashtag}`,
    `#PremiumLiving`,
  ];

  // Price estimation based on market and property type
  const typeKey = data.bedrooms === 0 ? "studio"
    : data.propertyType.toLowerCase() as keyof Market["pricePerSqft"];

  const basePricePerSqft =
    market.pricePerSqft[typeKey as keyof Market["pricePerSqft"]] ??
    market.pricePerSqft.apartment;

  const basePrice = basePricePerSqft * data.sizeSqft;
  const priceMin = Math.round(basePrice * 0.9);
  const priceMax = Math.round(basePrice * 1.15);

  // Rent estimation based on market yield
  const annualRentMin = Math.round(priceMin * market.rentYield.min);
  const annualRentMax = Math.round(priceMax * market.rentYield.max);
  const monthlyRentMin = Math.round(annualRentMin / 12);
  const monthlyRentMax = Math.round(annualRentMax / 12);

  return {
    title,
    description,
    instagramCaption,
    hashtags,
    priceRange: {
      min: priceMin,
      max: priceMax,
      currency,
      formatted: `${formatPrice(priceMin, market)} – ${formatPrice(priceMax, market)}`,
    },
    rentRange: {
      min: monthlyRentMin,
      max: monthlyRentMax,
      currency,
      period: "monthly",
      formatted: `${formatRent(monthlyRentMin, market)} – ${formatRent(monthlyRentMax, market)}`,
    },
  };
}

router.post("/generate", (req: Request, res: Response) => {
  const parseResult = GenerateListingBody.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: "validation_error",
      message: parseResult.error.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  try {
    const listing = generateMockListing(parseResult.data);
    const response = GenerateListingResponse.parse(listing);
    res.json(response);
  } catch (err) {
    console.error("Error generating listing:", err);
    res.status(500).json({
      error: "generation_error",
      message: "Failed to generate listing. Please try again.",
    });
  }
});

export default router;
