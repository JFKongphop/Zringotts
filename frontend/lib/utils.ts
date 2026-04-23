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
