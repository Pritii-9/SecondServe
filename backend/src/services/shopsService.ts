export interface ShopPlace {
  id: string;
  name: string;
  category: string;
  type: "restaurant" | "shop" | "other";
  coordinates: [number, number];
  address?: string;
}

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

function buildOverpassQuery(query?: string) {
  const searchFilter = query?.trim();
  const boundingBox = "18.34,73.72,18.62,73.98";

  if (searchFilter) {
    return `[out:json][timeout:25];
      (
        node["amenity"="restaurant"]["name"~"${searchFilter}",i](${boundingBox});
        node["shop"]["name"~"${searchFilter}",i](${boundingBox});
        way["amenity"="restaurant"]["name"~"${searchFilter}",i](${boundingBox});
        way["shop"]["name"~"${searchFilter}",i](${boundingBox});
        rel["amenity"="restaurant"]["name"~"${searchFilter}",i](${boundingBox});
        rel["shop"]["name"~"${searchFilter}",i](${boundingBox});
      );
      out center 100;`;
  }

  return `[out:json][timeout:25];
    (
      node["amenity"="restaurant"](${boundingBox});
      node["shop"](${boundingBox});
      way["amenity"="restaurant"](${boundingBox});
      way["shop"](${boundingBox});
      rel["amenity"="restaurant"](${boundingBox});
      rel["shop"](${boundingBox});
    );
    out center 100;`;
}

function elementToShopPlace(element: any): ShopPlace | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const tags = element.tags ?? {};
  const name = tags.name || tags.shop || tags.amenity || "Unknown";
  const type: ShopPlace["type"] = tags.amenity === "restaurant" ? "restaurant" : tags.shop ? "shop" : "other";
  const category = type === "restaurant" ? "restaurant" : tags.shop || tags.amenity || "shop";

  const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:postcode"]].filter(Boolean);

  const address = addressParts.length ? addressParts.join(", ") : undefined;
  return {
    id: `${element.type}/${element.id}`,
    name,
    category,
    type,
    coordinates: [lat, lon],
    ...(address ? { address } : {}),
  };
}

export async function fetchPuneShops(query?: string) {
  const overpassQuery = buildOverpassQuery(query);

  const response = await fetch(OVERPASS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `data=${encodeURIComponent(overpassQuery)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const body = await response.json();
  if (!Array.isArray(body.elements)) {
    return [];
  }

  const shops = body.elements
    .map((element: any) => elementToShopPlace(element))
    .filter((item: ShopPlace | null): item is ShopPlace => item !== null)
    .slice(0, 100);

  return shops;
}
