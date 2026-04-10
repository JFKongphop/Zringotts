#!/usr/bin/env node

/**
 * Generate real Merkle tree data for Foundry tests
 * Called via FFI from Solidity tests
 */

const path = require('path');

// Use node_modules from circuits directory
const circuitsPath = path.join(__dirname, '../../../circuits');
const { buildPoseidon } = require(path.join(circuitsPath, 'node_modules/circomlibjs'));
const { MerkleTree } = require(path.join(circuitsPath, 'node_modules/fixed-merkle-tree'));

async function generateMerkleData() {
  const poseidon = await buildPoseidon();
  
  // Poseidon hash function compatible with circuit
  const poseidonHash = (left, right) => {
    const hash = poseidon.F.toString(poseidon([left, right]));
    return BigInt(hash);
  };
  
  // Create a tree with 2 levels (4 leaves max)
  const tree = new MerkleTree(2, [], {
    hashFunction: poseidonHash,
    zeroElement: '0'
  });
  
  const command = process.argv[2];
  
  if (command === 'empty-root') {
    // Return the empty tree root
    console.log(tree.root.toString());
    
  } else if (command === 'hash-note') {
    // Hash a note with 6 fields (Poseidon6)
    // Args: lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce
    const lend_amt = process.argv[3] || '1000';
    const borrow_amt = process.argv[4] || '0';
    const will_liq_price = process.argv[5] || '2500';
    const timestamp = process.argv[6] || Math.floor(Date.now() / 1000).toString();
    const nullifier = process.argv[7] || '12345';
    const nonce = process.argv[8] || '67890';
    
    const noteHash = poseidon.F.toString(
      poseidon([lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce])
    );
    console.log(noteHash);
    
  } else if (command === 'insert-and-get-root') {
    // Insert a leaf and return the new root
    const leaf = process.argv[3];
    tree.insert(leaf);
    console.log(tree.root.toString());
    
  } else if (command === 'get-proof') {
    // Insert leaves and get proof for a specific index
    const numLeaves = parseInt(process.argv[3]);
    const targetIndex = parseInt(process.argv[4]);
    
    const leaves = [];
    for (let i = 0; i < numLeaves; i++) {
      // Generate a simple leaf hash
      const leaf = poseidon.F.toString(poseidon([i + 1]));
      leaves.push(leaf);
      tree.insert(leaf);
    }
    
    const proof = tree.proof(targetIndex);
    
    // Output as JSON
    const result = {
      root: tree.root.toString(),
      leaf: leaves[targetIndex],
      pathElements: proof.pathElements.map(e => e.toString()),
      pathIndices: proof.pathIndices
    };
    console.log(JSON.stringify(result));
    
  } else if (command === 'full-scenario') {
    // Generate a complete test scenario
    // 1. Create initial note hash
    const initialNote = {
      lend_amt: '1000',
      borrow_amt: '0',
      will_liq_price: '2500',
      timestamp: Math.floor(Date.now() / 1000).toString(),
      nullifier: '111111',
      nonce: '999999'
    };
    
    const initialHash = poseidon.F.toString(
      poseidon([
        initialNote.lend_amt,
        initialNote.borrow_amt,
        initialNote.will_liq_price,
        initialNote.timestamp,
        initialNote.nullifier,
        initialNote.nonce
      ])
    );
    
    // 2. Insert into tree
    tree.insert(initialHash);
    const rootAfterInsert = tree.root;
    
    // 3. Get proof
    const proof = tree.proof(0);
    
    // 4. Create updated note
    const updatedNote = {
      lend_amt: '1000',
      borrow_amt: '500',
      will_liq_price: '2500',
      timestamp: (Math.floor(Date.now() / 1000) + 60).toString(),
      nullifier: '222222',
      nonce: '888888'
    };
    
    const updatedHash = poseidon.F.toString(
      poseidon([
        updatedNote.lend_amt,
        updatedNote.borrow_amt,
        updatedNote.will_liq_price,
        updatedNote.timestamp,
        updatedNote.nullifier,
        updatedNote.nonce
      ])
    );
    
    const result = {
      emptyRoot: poseidon.F.toString(poseidon.F.zero),
      initialNote: {
        hash: initialHash,
        ...initialNote
      },
      rootAfterInsert: rootAfterInsert.toString(),
      proof: {
        pathElements: proof.pathElements.map(e => e.toString()),
        pathIndices: proof.pathIndices
      },
      updatedNote: {
        hash: updatedHash,
        ...updatedNote
      }
    };
    
    console.log(JSON.stringify(result));
    
  } else {
    console.error('Unknown command. Use: empty-root, hash-note, insert-and-get-root, get-proof, or full-scenario');
    process.exit(1);
  }
}

generateMerkleData().catch(err => {
  console.error(err);
  process.exit(1);
});
