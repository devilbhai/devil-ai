---
name: maps-extraction
description: Google Maps data extraction. Covers business listing scraping, place details, reviews extraction, geocoding, distance calculations, API usage.
---

# Google Maps Data Extraction

## When to Apply
- Extracting business listings from Google Maps
- Gathering place details, reviews, and ratings
- Geocoding addresses to coordinates
- Calculating distances between locations
- Building local business directories

## Core Concepts
- **Places API**: Structured access to business data
- **Geocoding**: Address <-> latitude/longitude conversion
- **Distance Matrix**: Travel time/distance between points
- **Reviews**: Star ratings, text reviews, reviewer info
- **Pagination**: Handle large result sets with cursors

## Implementation

### Places Search (Playwright-based)
```ts
async function searchPlaces(query: string, location: { lat: number; lng: number }) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${location.lat},${location.lng},14z`
  await page.goto(url)
  await page.waitForSelector('[role="feed"]')

  const results = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="feed"] > div > div')).map((el) => ({
      name: el.querySelector("div[role="heading"]")?.textContent?.trim(),
      rating: el.querySelector(".fontBodyMedium")?.textContent?.trim(),
      address: el.querySelector(".fontBodyMedium:nth-child(2)")?.textContent?.trim(),
    })),
  )
  await browser.close()
  return results
}
```

### Place Details Extraction
```ts
async function getPlaceDetails(page: Page, placeUrl: string) {
  await page.goto(placeUrl)
  await page.waitForSelector('[data-attrid="kc:/local:one box"]')

  return page.evaluate(() => {
    const get = (sel: string) => document.querySelector(sel)?.textContent?.trim()
    return {
      name: get('[data-attrid="title"]'),
      rating: get('. span[aria-hidden="true"]'),
      reviews: get('. span[aria-label*="reviews"]'),
      address: get('[data-attrid="kc:/local:one box:address"]'),
      phone: get('[data-attrid="kc:/local:one box:phone"]'),
      hours: get('[data-attrid="kc:/local:one box:hours"]'),
    }
  })
}
```

### Geocoding (API)
```ts
async function geocode(address: string, apiKey: string) {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
  )
  const data = await res.json()
  if (data.status !== "OK") throw new Error(`Geocode failed: ${data.status}`)
  return {
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng,
    formatted: data.results[0].formatted_address,
  }
}
```

### Distance Calculation
```ts
function haversineDistance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
```

## Best Practices
- Use Google Maps Platform APIs for structured, legal access
- Respect rate limits (Maps API quotas)
- Cache geocoding results (addresses rarely change)
- Handle Maps scraping carefully (rate limits, CAPTCHAs)
- Store coordinates alongside addresses for distance queries
- Use `@types/node-fetch` for type-safe API calls
- Batch geocoding requests with `|` delimiter when possible
