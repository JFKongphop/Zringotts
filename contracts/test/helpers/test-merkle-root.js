#!/usr/bin/env node

const path = require('path');
const circuitsPath = path.join(__dirname, '../../../circuits');
const { buildPoseidon } = require(path.join(circuitsPath, 'node_modules/circomlibjs'));
const { MerkleTree } = require(path.join(circuitsPath, 'node_modules/fixed-merkle-tree'));

(async () => {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;
  
  const hash2 = (left, right) => {
    const hash = poseidon([BigInt(left), BigInt(right)]);
    return F.toString(hash);
  };
  
  const hashNote = (l, b, w, t, n, nc) => {
    const hash = poseidon([BigInt(l), BigInt(b), BigInt(w), BigInt(t), BigInt(n), BigInt(nc)]);
    return F.toString(hash);
  };
  
  const prevHash = hashNote('0', '0', '0', '0', '0', '0');
  console.log('prevHash:', prevHash);
  
  const tree =  new MerkleTree(2, [], { hashFunction: hash2, zeroElement: '0' });
  tree.insert(prevHash);
  console.log('tree root:', tree.root.toString());
  console.log('tree elements:', tree.elements);
  console.log('tree _layers:', tree._layers);
  console.log('tree capacity:', tree.capacity);
  
  // Try to understand the tree structure
  // Tree capacity 4 means 4 leaves at level 0
  // Level 1 has 2 nodes  
  // Level 2 (root) has 1 node
  
  // When we insert 1 element, it goes to index 0
  // Level 0: [prevHash, 0, 0, 0]
  // Level 1: [hash(prevHash, 0), hash(0, 0)]
  // Level 2: [hash(level1[0], level1[1])]
  
  const zero_hash = hash2('0', '0');
  console.log('\nzero_hash (hash(0, 0)):', zero_hash);
  
  const level1_pos0 = hash2(prevHash, '0');
  const level1_pos1 = zero_hash;
  console.log('level1_pos0 (hash(prevHash, 0)):', level1_pos0);
  console.log('level1_pos1 (hash(0, 0)):', level1_pos1);
  
  const root = hash2(level1_pos0, level1_pos1);
  console.log('computed root (hash(level1_pos0, level1_pos1)):', root);
  console.log('tree root:', tree.root.toString());
  console.log('match?', root === tree.root.toString());
})();
