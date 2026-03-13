# ListingPilot AI

## Overview

A luxury SaaS web app for real estate agents in the USA and UAE. Agents enter property details and get AI-generated listing content including SEO title, professional description, Instagram caption, hashtags, and estimated price/rent ranges.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/listing-pilot)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (provisioned but not yet used)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Form handling**: react-hook-form + @hookform/resolvers
- **Animations**: framer-motion
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── listing-pilot/          # React + Vite frontend (serves at /)
│   └── api-server/             # Express API server (serves at /api)
├── lib/
│   ├── api-spec/               # OpenAPI spec + Orval codegen config
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas from OpenAPI
│   └── db/                     # Drizzle ORM schema + DB connection
├── scripts/                    # Utility scripts
└── ...
```

## API Endpoints

### POST /api/listings/generate

Generate AI listing content from property details.

**Request:**
```json
{
  "location": "Dubai Marina, UAE",
  "propertyType": "Penthouse",
  "listingPurpose": "sale",
  "bedrooms": 3,
  "bathrooms": 3,
  "sizeSqft": 3200,
  "amenities": "Pool, Gym, Sea View, Concierge"
}
```

**Response:**
```json
{
  "title": "SEO-optimized title...",
  "description": "Professional description...",
  "instagramCaption": "Instagram caption...",
  "hashtags": ["#tag1", "#tag2", ...],
  "priceRange": { "min": 10080000, "max": 12880000, "currency": "AED" },
  "rentRange": { "min": 54600, "max": 80500, "currency": "AED", "period": "monthly" }
}
```

## Features

- Luxury dark theme (deep blacks + gold accents)
- Property details form with location, type, purpose, bedrooms, bathrooms, sqft, amenities, photo upload
- AI-powered (currently mock) listing generation
- Region-aware pricing (USD for USA, AED for UAE)
- Copy buttons for all generated content
- Loading and error states
- Fully responsive (mobile + desktop)

## AI Integration

Currently uses smart mock generation logic that:
- Detects region (UAE vs USA) from location text
- Generates realistic price ranges based on property type and size
- Creates contextual titles, descriptions, Instagram captions, and hashtags
- Can be connected to a real LLM (OpenAI, Anthropic) via Replit AI Integrations

## Development

- Frontend dev server: `pnpm --filter @workspace/listing-pilot run dev`
- API server: `pnpm --filter @workspace/api-server run dev`
- Run codegen after OpenAPI changes: `pnpm --filter @workspace/api-spec run codegen`
