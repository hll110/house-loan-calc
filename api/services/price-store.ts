import fs from "fs";
import path from "path";
import type { CityPrice } from "../../contracts/loan";
import { cityPrices as defaultPrices } from "../../contracts/loan";
import { fetchLatestPrices } from "./price-fetcher";

interface PriceData {
  prices: CityPrice[];
  updatedAt: string;
  source: string;
}

const DATA_FILE = path.resolve(
  import.meta.dirname,
  "../../data/city-prices.json"
);

let cachedData: PriceData | null = null;

function loadFromFile(): PriceData | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(raw) as PriceData;
      if (data.prices && data.prices.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("[PriceStore] Failed to load data file:", err);
  }
  return null;
}

function saveToFile(data: PriceData): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[PriceStore] Saved ${data.prices.length} cities to file`);
  } catch (err) {
    console.warn("[PriceStore] Failed to save data file:", err);
  }
}

export function getPriceData(): PriceData {
  if (cachedData) return cachedData;

  const fileData = loadFromFile();
  if (fileData) {
    cachedData = fileData;
    return fileData;
  }

  return {
    prices: defaultPrices,
    updatedAt: new Date().toISOString(),
    source: "built-in",
  };
}

export function getCities(): CityPrice[] {
  return getPriceData().prices;
}

export function getCitiesByTier(tier: number): CityPrice[] {
  return getCities().filter((c) => c.tier === tier);
}

export function searchCities(keyword: string): CityPrice[] {
  const lower = keyword.toLowerCase();
  return getCities().filter(
    (c) =>
      c.cityName.includes(keyword) ||
      c.province.includes(keyword) ||
      c.cityName.toLowerCase().includes(lower) ||
      c.province.toLowerCase().includes(lower)
  );
}

export function getUpdateInfo(): { updatedAt: string; source: string; cityCount: number } {
  const data = getPriceData();
  return {
    updatedAt: data.updatedAt,
    source: data.source,
    cityCount: data.prices.length,
  };
}

export async function updatePrices(): Promise<{
  success: boolean;
  message: string;
  cityCount: number;
}> {
  try {
    const result = await fetchLatestPrices();

    if (!result) {
      return {
        success: false,
        message: "所有数据源获取失败，保留现有数据",
        cityCount: getCities().length,
      };
    }

    const existingData = getPriceData();
    const mergedPrices = mergePrices(existingData.prices, result.prices);

    const newData: PriceData = {
      prices: mergedPrices,
      updatedAt: result.fetchedAt,
      source: result.source,
    };

    saveToFile(newData);
    cachedData = newData;

    return {
      success: true,
      message: `从 ${result.source} 更新了 ${result.prices.length} 个城市数据`,
      cityCount: mergedPrices.length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[PriceStore] Update failed:", msg);
    return {
      success: false,
      message: `更新失败: ${msg}`,
      cityCount: getCities().length,
    };
  }
}

function mergePrices(
  existing: CityPrice[],
  fetched: CityPrice[]
): CityPrice[] {
  const map = new Map<string, CityPrice>();

  for (const city of existing) {
    map.set(city.cityName, city);
  }

  for (const city of fetched) {
    const prev = map.get(city.cityName);
    map.set(city.cityName, {
      ...city,
      province: city.province || prev?.province || "",
      tier: city.tier || prev?.tier || 3,
    });
  }

  const result = Array.from(map.values());
  result.sort((a, b) => a.tier - b.tier || b.newPrice - a.newPrice);
  return result;
}
