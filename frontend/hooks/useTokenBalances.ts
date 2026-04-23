import { useAccount, useReadContracts } from 'wagmi';
import { WETH_ADDRESS, USDC_ADDRESS, ERC20_ABI } from '@/lib/contracts';

export function useTokenBalances() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: WETH_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      },
      {
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  });

  return {
    weth: data?.[0]?.result as bigint | undefined,
    usdc: data?.[1]?.result as bigint | undefined,
    isLoading,
    refetch,
  };
}
