import { useReadContract } from 'wagmi';
import { ZRINGOTTS_ADDRESS, ZRINGOTTS_ABI } from '@/lib/contracts';

export interface ProtocolState {
  weth_deposit_amount: bigint;
  weth_borrow_amount: bigint;
  usdc_deposit_amount: bigint;
  usdc_borrow_amount: bigint;
}

export function useContractState() {
  return useReadContract({
    address: ZRINGOTTS_ADDRESS as `0x${string}`,
    abi: ZRINGOTTS_ABI,
    functionName: 'state',
    query: {
      refetchInterval: 15_000,
      select: (raw: any) => ({
        weth_deposit_amount: raw.weth_deposit_amount ?? raw[0] ?? BigInt(0),
        weth_borrow_amount:  raw.weth_borrow_amount  ?? raw[1] ?? BigInt(0),
        usdc_deposit_amount: raw.usdc_deposit_amount ?? raw[2] ?? BigInt(0),
        usdc_borrow_amount:  raw.usdc_borrow_amount  ?? raw[3] ?? BigInt(0),
      } as ProtocolState),
    },
  });
}
