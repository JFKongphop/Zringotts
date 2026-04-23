import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

const evmOneTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 2124225178762456),
  name: 'Initia evm-1',
  nativeCurrency: { name: 'INIT', symbol: 'INIT', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL ?? 'https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz'],
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [evmOneTestnet],
  connectors: [
    injected({
      target() {
        // Try to find Initia wallet - it might be in window.initia or window.ethereum
        if (typeof window !== 'undefined') {
          const win = window as any;
          // Check for Initia-specific provider first
          if (win.initia) {
            return {
              id: 'initia',
              name: 'Initia Wallet',
              provider: win.initia,
            };
          }
          // Fallback to ethereum provider if it's from Initia
          if (win.ethereum?.isInitia) {
            return {
              id: 'initia',
              name: 'Initia Wallet',
              provider: win.ethereum,
            };
          }
          // Last resort: use ethereum but prefer non-MetaMask
          if (win.ethereum && !win.ethereum.isMetaMask) {
            return {
              id: 'injected',
              name: 'Injected Wallet',
              provider: win.ethereum,
            };
          }
        }
        return {
          id: 'injected',
          name: 'Injected Wallet',
          provider: typeof window !== 'undefined' ? (window as any).ethereum : undefined,
        };
      },
    }),
  ],
  transports: { [evmOneTestnet.id]: http() },
});
