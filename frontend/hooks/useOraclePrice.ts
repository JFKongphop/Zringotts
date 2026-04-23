'use client';

import { useReadContract } from 'wagmi';

// Oracle contract ABI for price reading
const ORACLE_ABI = [
  {
    inputs: [{ name: 'pair_id', type: 'string' }],
    name: 'get_price',
    outputs: [
      {
        components: [
          { name: 'price', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'height', type: 'uint64' },
          { name: 'nonce', type: 'uint64' },
          { name: 'decimal', type: 'uint64' },
          { name: 'id', type: 'uint64' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ConnectOracle address (optional - set via env or default to mock)
const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE_ADDRESS as `0x${string}` | undefined;

interface PriceData {
  price: bigint;
  timestamp: bigint;
  decimal: number;
  normalizedPrice: number; // price / 10^decimal
}

/**
 * Fetch price from ConnectOracle.
 * Falls back to hardcoded prices if oracle not configured.
 */
export function useOraclePrice(pairId: string, fallbackPrice: number = 0): PriceData | null {
  const { data, isError } = useReadContract({
    address: ORACLE_ADDRESS,
    abi: ORACLE_ABI,
    functionName: 'get_price',
    args: [pairId],
    query: {
      enabled: !!ORACLE_ADDRESS,
      refetchInterval: 30_000, // 30s
    },
  });

  // If oracle not configured or error, return fallback
  if (!ORACLE_ADDRESS || isError || !data) {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return {
      price: BigInt(Math.floor(fallbackPrice * 1e8)), // Assume 8 decimals
      timestamp: now,
      decimal: 8,
      normalizedPrice: fallbackPrice,
    };
  }

  const priceData = data as { price: bigint; timestamp: bigint; height: bigint; nonce: bigint; decimal: bigint; id: bigint };
  const normalizedPrice = Number(priceData.price) / Math.pow(10, Number(priceData.decimal));

  return {
    price: priceData.price,
    timestamp: priceData.timestamp,
    decimal: Number(priceData.decimal),
    normalizedPrice,
  };
}

/**
 * Hook to get current ETH and USDC prices.
 * Uses ConnectOracle if available, otherwise hardcoded fallbacks.
 */
export function usePrices() {
  const ethPrice = useOraclePrice('ETH/USD', 2250);
  const usdcPrice = useOraclePrice('USDC/USD', 1);

  return {
    ETH: ethPrice?.normalizedPrice ?? 2250,
    USDC: usdcPrice?.normalizedPrice ?? 1,
    isLive: !!ORACLE_ADDRESS,
  };
}
