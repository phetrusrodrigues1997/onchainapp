// utils/getPrice.ts
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

const symbolToIdMap: Record<string, string> = {
  ETH: 'ethereum',
  AERO: 'aerodrome-finance',
  VIRTUAL: 'virtual-protocol',
  BTC: 'bitcoin',
  AAVE: 'aave',
  MORPHO: 'morpho',
  USDC: 'usd-coin',
  EURC: 'euro-coin',
  CADC: 'cad-coin',
  BRZ: 'brz',
  TRYB: 'bilira',
  MXNe: 'mexican-peso-tether',
};

export async function getPrice(symbolOrId: string): Promise<number | null> {
  const id = symbolToIdMap[symbolOrId.toUpperCase()] || symbolOrId.toLowerCase();

  try {
    const response = await fetch(`${COINGECKO_API}?ids=${id}&vs_currencies=usd`);
    const data = await response.json();
    return data[id]?.usd ?? null;
  } catch (error) {
    console.error(`Error fetching price for ${symbolOrId}:`, error);
    return null;
  }
}
