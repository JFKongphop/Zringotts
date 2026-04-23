import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatAmount(raw: bigint | number, decimals: number, precision = 4): string {
  const val = Number(raw) / Math.pow(10, decimals);
  return val.toLocaleString(undefined, { maximumFractionDigits: precision });
}

export function formatUsd(value: number): string {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export function formatBalance(raw: bigint, decimals: number, precision = 4): string {
  const val = Number(raw) / Math.pow(10, decimals);
  return val.toLocaleString(undefined, { maximumFractionDigits: precision });
}

// Switch MetaMask to Initia evm-1 network or add it if not present
export async function switchToInitiaNetwork() {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? '2124225178762456';
  const chainIdHex = `0x${BigInt(chainId).toString(16)}`;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz';

  try {
    // Try to switch to the network
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    // If network doesn't exist (error code 4902), add it
    if (switchError.code === 4902) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: 'Initia evm-1',
              nativeCurrency: {
                name: 'INIT',
                symbol: 'INIT',
                decimals: 18,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: ['https://scan.testnet.initia.xyz/initiation-2'],
            },
          ],
        });
      } catch (addError) {
        throw new Error('Failed to add Initia network to MetaMask');
      }
    } else {
      throw switchError;
    }
  }
}
