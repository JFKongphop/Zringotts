'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NoteSecrets {
  lendAmt: string;
  borrowAmt: string;
  willLiqPrice: string;
  timestamp: string;
  nullifier: string;
  nonce: string;
}

export interface Position {
  depositToken: 'WETH' | 'USDC';
  depositAmount: string;
  borrowToken: 'WETH' | 'USDC';
  borrowAmount: string;
  commitment: string;
  createdAt: number;
  status: 'active' | 'repaid';
  /** ZK note secrets — kept local only, NEVER sent to chain */
  note?: NoteSecrets;
}

const STORAGE_KEY = 'zringotts:positions';

function load(): Position[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(positions: Position[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

export function usePositionStore() {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    setPositions(load());
  }, []);

  const addPosition = useCallback((pos: Position) => {
    setPositions((prev) => {
      const next = [pos, ...prev];
      save(next);
      return next;
    });
  }, []);

  const markRepaid = useCallback((commitment: string) => {
    setPositions((prev) => {
      const next = prev.map((p) =>
        p.commitment === commitment ? { ...p, status: 'repaid' as const } : p,
      );
      save(next);
      return next;
    });
  }, []);

  const updatePosition = useCallback((commitment: string, updates: Partial<Position>) => {
    setPositions((prev) => {
      const next = prev.map((p) =>
        p.commitment === commitment ? { ...p, ...updates } : p,
      );
      save(next);
      return next;
    });
  }, []);

  return { positions, addPosition, markRepaid, updatePosition };
}
