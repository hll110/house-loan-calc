import type { CityPrice } from "../../contracts/loan";

interface FetchResult {
  prices: CityPrice[];
  source: string;
  fetchedAt: string;
}

const CITY_TIER_MAP: Record<string, number> = {
  北京: 1, 上海: 1, 广州: 1, 深圳: 1,
  杭州: 2, 南京: 2, 苏州: 2, 成都: 2, 武汉: 2, 西安: 2,
  天津: 2, 重庆: 2, 青岛: 2, 济南: 2, 郑州: 2, 厦门: 2,
  宁波: 2, 无锡: 2, 东莞: 2, 佛山: 2, 长沙: 2, 大连: 2,
  沈阳: 2, 昆明: 2, 哈尔滨: 2, 长春: 2, 石家庄: 2, 太原: 2,
  合肥: 2, 福州: 2, 南昌: 2, 南宁: 2, 贵阳: 2, 兰州: 2, 海口: 2,
};

function getCityTier(cityName: string): number {
  return CITY_TIER_MAP[cityName] ?? 3;
}

async function fetchWithTimeout(url: string, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HouseLoanCalc/1.0)",
        Accept: "application/json, text/html, */*",
      },
    });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromCreprice(): Promise<CityPrice[]> {
  const resp = await fetchWithTimeout(
    "https://www.creprice.cn/rank/cityprice.html"
  );
  if (!resp.ok) throw new Error(`creprice HTTP ${resp.status}`);
  const html = await resp.text();

  const prices: CityPrice[] = [];
  const rowRegex =
    /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const cityName = match[1].replace(/<[^>]*>/g, "").trim();
    const newPriceStr = match[2].replace(/<[^>]*>/g, "").trim();
    const oldPriceStr = match[3].replace(/<[^>]*>/g, "").trim();
    const changeStr = match[4].replace(/<[^>]*>/g, "").trim();

    const newPrice = parseFloat(newPriceStr);
    const oldPrice = parseFloat(oldPriceStr);
    const change = parseFloat(changeStr);

    if (cityName && !isNaN(newPrice) && newPrice > 0) {
      prices.push({
        cityName,
        province: "",
        newPrice: Math.round(newPrice),
        oldPrice: isNaN(oldPrice) ? Math.round(newPrice) : Math.round(oldPrice),
        change: isNaN(change) ? 0 : parseFloat(change.toFixed(2)),
        tier: getCityTier(cityName),
      });
    }
  }

  if (prices.length === 0) throw new Error("No data parsed from creprice");
  return prices;
}

async function fetchFromFangAPI(): Promise<CityPrice[]> {
  const resp = await fetchWithTimeout(
    "https://datacenter.cifi.org/api/public/cityPrice"
  );
  if (!resp.ok) throw new Error(`fang API HTTP ${resp.status}`);
  const data = await resp.json() as Record<string, unknown>[];

  const prices: CityPrice[] = [];
  for (const item of data) {
    const cityName = String(item.cityName || item.city || "").trim();
    const newPrice = Number(item.newPrice || item.price || 0);
    if (cityName && newPrice > 0) {
      prices.push({
        cityName,
        province: String(item.province || ""),
        newPrice: Math.round(newPrice),
        oldPrice: Math.round(Number(item.secondPrice || item.oldPrice || newPrice)),
        change: parseFloat(Number(item.monthChange || item.change || 0).toFixed(2)),
        tier: getCityTier(cityName),
      });
    }
  }

  if (prices.length === 0) throw new Error("No data from fang API");
  return prices;
}

export async function fetchLatestPrices(): Promise<FetchResult | null> {
  const sources = [
    { name: "creprice", fn: fetchFromCreprice },
    { name: "fang-api", fn: fetchFromFangAPI },
  ];

  for (const source of sources) {
    try {
      console.log(`[PriceFetcher] Trying source: ${source.name}`);
      const prices = await source.fn();
      console.log(
        `[PriceFetcher] Success from ${source.name}: ${prices.length} cities`
      );
      return {
        prices,
        source: source.name,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn(
        `[PriceFetcher] Failed from ${source.name}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.error("[PriceFetcher] All sources failed");
  return null;
}
