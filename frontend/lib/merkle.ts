/**
 * Merkle tree reconstruction from blockchain events
 * Supports multiple positions by querying CommitmentAdded events
 */

import { PublicClient } from 'viem';
import { ZRINGOTTS_ADDRESS } from './contracts';

const COMMITMENT_ADDED_SIG = '0x12bc1b1892df9b3d59874d647be2cef182be9c84524d357d59dbb7dc561f6843';

// Merkle tree constants (must match circuit)
const LEVELS = 2; // Tree height
const ZERO_VALUE = 0n;
const Z_1 = 14744269619966411208579211824598458697587494354926760081771325075741142829156n;

/**
 * Query all commitments from blockchain events
 */
export async function getAllCommitments(publicClient: PublicClient): Promise<{ commitment: bigint; index: number }[]> {
  console.log('[Merkle] Querying all CommitmentAdded events...');
  
  const logs = await publicClient.getLogs({
    address: ZRINGOTTS_ADDRESS as `0x${string}`,
    event: {
      type: 'event',
      name: 'CommitmentAdded',
      inputs: [
        { type: 'bytes32', indexed: true, name: 'commitment' },
        { type: 'uint32', indexed: true, name: 'leafIndex' },
      ],
    },
    fromBlock: 0n,
    toBlock: 'latest',
  });

  console.log(`[Merkle] Found ${logs.length} commitment events`);

  const commitments = logs.map((log) => {
    const commitment = BigInt(log.topics[1] as string);
    const index = Number(BigInt(log.topics[2] as string));
    console.log(`[Merkle] Event: index=${index}, commitment=${commitment.toString()}`);
    return { commitment, index };
  });

  // Sort by index to ensure correct order
  commitments.sort((a, b) => a.index - b.index);

  console.log('[Merkle] Sorted commitments:', commitments.map(c => `[${c.index}] ${c.commitment.toString()}`));

  return commitments;
}

/**
 * Compute Merkle path for a specific leaf index
 * @param leafIndex The index of the leaf (0-based)
 * @param allCommitments All commitments in the tree
 * @param poseidon Poseidon hash function from circomlibjs
 */
export async function computeMerklePath(
  leafIndex: number,
  allCommitments: bigint[],
  poseidon: any,
): Promise<bigint[]> {
  console.log(`[Merkle] Computing path for leaf index ${leafIndex}`);
  console.log(`[Merkle] Total leaves: ${allCommitments.length}`);

  const F = poseidon.F;
  const path: bigint[] = [];

  // Build the tree level by level
  const maxLeaves = 2 ** LEVELS; // 4 leaves for LEVELS=2
  let currentLevel: bigint[] = [];
  
  // Initialize leaves: fill with actual commitments, pad rest with ZERO_VALUE
  for (let i = 0; i < maxLeaves; i++) {
    currentLevel.push(i < allCommitments.length ? allCommitments[i] : ZERO_VALUE);
  }

  console.log(`[Merkle] Tree leaves:`, currentLevel.map(l => l.toString()));

  let currentIndex = leafIndex;

  for (let level = 0; level < LEVELS; level++) {
    // Get sibling for current node
    const isRightNode = currentIndex % 2 === 1;
    const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
    const sibling = currentLevel[siblingIndex];

    path.push(sibling);
    console.log(`[Merkle] Level ${level}: index=${currentIndex}, isRight=${isRightNode}, sibling=${sibling.toString()}`);

    // Compute next level
    const nextLevel: bigint[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1];
      
      const hashField = poseidon([left, right]);
      const hash = F.toObject(hashField) as bigint;
      nextLevel.push(hash);
    }

    currentLevel = nextLevel;
    currentIndex = Math.floor(currentIndex / 2);
  }

  console.log(`[Merkle] Computed path:`, path.map(p => p.toString()));
  return path;
}

/**
 * Compute Merkle root from a leaf and its path
 */
export function computeRoot(
  leaf: bigint,
  leafIndex: number,
  path: bigint[],
  poseidon: any,
): bigint {
  const F = poseidon.F;
  let current = leaf;

  console.log(`[computeRoot] Starting with leaf=${current.toString()}, leafIndex=${leafIndex}`);

  for (let i = 0; i < path.length; i++) {
    // Check if we're a right node at this level (using bit operations)
    // Bit i tells us if we're left (0) or right (1) at level i
    const isRight = (leafIndex & (1 << i)) !== 0;
    const sibling = path[i];

    console.log(`[computeRoot] Level ${i}: isRight=${isRight}, sibling=${sibling.toString()}, current=${current.toString()}`);

    const hashField = isRight
      ? poseidon([sibling, current])
      : poseidon([current, sibling]);
    
    current = F.toObject(hashField) as bigint;
    console.log(`[computeRoot] Level ${i} result: ${current.toString()}`);
  }

  console.log(`[computeRoot] Final root: ${current.toString()}`);
  return current;
}
