import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { initiaPrivyWalletConnector } from '@initia/interwovenkit-react';

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
  connectors: [initiaPrivyWalletConnector],
  transports: {
    [evmOneTestnet.id]: http(),
  },
});
