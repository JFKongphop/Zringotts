const circomlibjs = require('circomlibjs');

(async () => {
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;
  
  // The two commitments from blockchain
  const leaf0 = BigInt('0x2bac378b28875f789806dfc0fc53a20b91b9c8b3214694f8765a3a55123e6011');
  const leaf1 = BigInt('0x1cf6d6ca9aab6221db4c80dd6d8e926f37cc195718ae0af3a1e6a75c9b8c41ee');
  
  // Zero values for empty slots
  const Z_0 = 0n;
  const Z_1 = 14744269619966411208579211824598458697587494354926760081771325075741142829156n;
  
  console.log('Building Merkle tree with LEVEL=2 (4 leaves):');
  console.log('Leaf[0]:', leaf0.toString());
  console.log('Leaf[1]:', leaf1.toString());
  console.log('Leaf[2]:', Z_0.toString(), '(empty)');
  console.log('Leaf[3]:', Z_0.toString(), '(empty)');
  console.log('');
  
  // Level 0 -> Level 1 (hash pairs)
  const hash01 = F.toObject(poseidon([leaf0, leaf1]));
  const hash23 = F.toObject(poseidon([Z_0, Z_0]));  // This should equal Z_1
  
  console.log('Level 1:');
  console.log('  hash(leaf0, leaf1):', hash01.toString());
  console.log('  hash(Z_0, Z_0):', hash23.toString());
  console.log('  Expected Z_1:', Z_1.toString());
  console.log('  Match Z_1:', hash23.toString() === Z_1.toString());
  console.log('');
  
  // Level 1 -> Root (Level 2)
  const root = F.toObject(poseidon([hash01, Z_1]));
  
  console.log('Root:', root.toString());
  console.log('');
  
  // Now compute path for leaf1 (index 1)
  console.log('Computing Merkle path for index 1:');
  console.log('  Index 1 in binary: 01 (reading right-to-left: bit0=1, bit1=0)');
  console.log('  Level 0: sibling is leaf0 (we are RIGHT node) =', leaf0.toString());
  console.log('  Level 1: sibling is Z_1 (we are LEFT node) =', Z_1.toString());
  console.log('');
  
  // Verify the path
  let current = leaf1;
  console.log('Verifying path from leaf1:');
  console.log('  Start:', current.toString());
  
  // Level 0: index 1 means bit 0 = 1 (right node)
  const sibling0 = leaf0;
  current = F.toObject(poseidon([sibling0, current]));  // sibling on left
  console.log('  After level 0: hash(sibling, current) =', current.toString());
  console.log('  Expected hash01:', hash01.toString());
  console.log('  Match:', current.toString() === hash01.toString());
  
  // Level 1: index >> 1 = 0, bit 1 = 0 (left node)
  const sibling1 = Z_1;
  current = F.toObject(poseidon([current, sibling1]));  // sibling on right
  console.log('  After level 1: hash(current, sibling) =', current.toString());
  console.log('  Expected root:', root.toString());
  console.log('  Match:', current.toString() === root.toString());
})();
