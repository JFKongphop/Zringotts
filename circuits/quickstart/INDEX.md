# Quickstart Folder - File Index

## 🚀 Main Files

| File | Purpose | Usage |
|------|---------|-------|
| **`zringotts-helper.js`** | Core helper class | `const ZringottsCircuit = require('./zringotts-helper')` |
| **`examples.js`** | 4 complete examples | `node examples.js` |
| **`simple.js`** | Minimal standalone example | `node simple.js` |
| **`run.js`** | Run all examples | `node run.js` or `node run.js --clean` |
| **`run-clean.js`** | Run & auto-cleanup wrapper | `node run-clean.js all` (recommended) |
| **`clean.sh`** | Manual cleanup script | `bash clean.sh` |
| **`.gitignore`** | Ignore generated files | Auto-configured |
| **`README.md`** | Complete documentation | Read first! |

## ✨ Key Features

### ZringottsCircuit Helper Class

```javascript
const circuit = new ZringottsCircuit();
await circuit.init();

// Create notes with Poseidon hashing
const note = circuit.createNote(lend, borrow, price, time, nullifier, nonce);

// Real Merkle tree with fixed-merkle-tree
circuit.insertNote(note);
const proof = circuit.getMerkleProof(note.hash);

// Generate circuit inputs automatically
const input = circuit.generateInitialNoteInput(note, lendIn, borrowIn);
const input2 = circuit.generateUpdateNoteInput(prevNote, newNote, tokens);

// Run witness generation
await circuit.generateWitness(inputFile, outputFile);
```

## 📚 Examples Included

### Example 1: Initial Deposit ✅
- Create first lending position
- Deposit collateral + borrow tokens
- **Output:** `input_example1.json`, `witness_example1.wtns`

### Example 2: Add Collateral ✅
- Add more collateral to existing position
- Improve LTV ratio
- Uses real Merkle proof
- **Output:** `input_example2.json`, `witness_example2.wtns`

### Example 3: Borrow More ✅
- Borrow additional tokens
- Against existing collateral
- **Output:** `input_example3.json`, `witness_example3.wtns`

### Example 4: Repay Debt ✅
- Pay back borrowed tokens
- Reduce debt
- **Output:** `input_example4.json`, `witness_example4.wtns`

### Simple Example ✅
- Minimal code demonstration
- Easy to understand
- **Output:** `my_lending_position.json`, `my_witness.wtns`

## 🔧 Dependencies Used

| Package | What For | Where |
|---------|----------|-------|
| **circomlibjs** | Poseidon hashing | `buildPoseidon()` |
| **fixed-merkle-tree** | Merkle proofs | `MerkleTree` class |
| **fs** | File I/O | Save JSON inputs |
| **child_process** | Run witness gen | Execute circuit |

## 📊 Generated Files

After running examples, you'll have:

```
quickstart/
├── input_example1.json          ✅ Circuit input (1.1 KB)
├── input_example2.json          ✅ Circuit input
├── input_example3.json          ✅ Circuit input
├── input_example4.json          ✅ Circuit input
├── my_lending_position.json     ✅ Simple example input
├── witness_example1.wtns        ✅ ZK witness (429 KB)
├── witness_example2.wtns        ✅ ZK witness
├── witness_example3.wtns        ✅ ZK witness
├── witness_example4.wtns        ✅ ZK witness
└── my_witness.wtns              ✅ Simple example witness
```

## 🧹 Cleanup Generated Files

### Option 1: Run & Clean Wrapper (Easiest)
```bash
node run-clean.js all      # Run all examples + auto-cleanup
node run-clean.js simple   # Run simple + auto-cleanup
node run-clean.js clean    # Just cleanup
node run-clean.js list     # List files
```

### Option 2: Built-in Flags
```bash
node run.js --clean        # Run with cleanup
node simple.js --clean     # Run simple with cleanup
```

### Option 3: Manual Cleanup
```bash
bash clean.sh              # Run cleanup script
rm *.json *.wtns          # Or delete manually
```

**Tip:** Use `run-clean.js all` for the cleanest workflow!

## 🎯 What Makes This Real?

### ✅ Real Poseidon Hashing
Uses `circomlibjs` - same library as circuit:
- Hashes notes with 6 elements
- Hashes Merkle nodes with 2 elements  
- Compatible with circuit Poseidon

### ✅ Real Merkle Tree
Uses `fixed-merkle-tree` - production-ready:
- Automatic path calculation
- Correct sibling selection
- Valid inclusion proofs
- Matching tree levels (2)

### ✅ Real Circuit Integration
- Generates valid circuit inputs
- Runs actual witness generation
- Verifies constraints
- Produces real `.wtns` files

### ✅ Real Constraint Handling
- LTV ratio validation
- Interest calculations
- Token flow checks
- Conditional logic

## 🚦 Quick Commands

```bash
# Run all 4 examples (with auto-cleanup)
node run-clean.js all

# Run all 4 examples (no cleanup)
node run.js

# Run simple example (with cleanup)
node run-clean.js simple

# Run simple example (no cleanup)
node simple.js

# Run specific example
node examples.js

# Test the helper
node zringotts-helper.js

# Cleanup generated files
node run-clean.js clean
bash clean.sh

# Create your own
cp simple.js my-custom.js
# Edit and run!
```

## 🎓 Learning Path

1. **Read:** `README.md` - Understand the API
2. **Run:** `node simple.js` - See it work
3. **Study:** `simple.js` - Minimal code
4. **Explore:** `node run.js` - All scenarios
5. **Inspect:** `zringotts-helper.js` - How it works
6. **Build:** Create your own scripts!

## 💡 Integration Examples

### Web Application
```javascript
// frontend/src/lending.js
import ZringottsCircuit from './zringotts-helper.js';

export async function createPosition(amount, borrow) {
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  const note = circuit.createNote(/* ... */);
  return {
    noteHash: note.hash,
    input: circuit.generateInitialNoteInput(note, amount, borrow)
  };
}
```

### Backend API
```javascript
// server.js
const express = require('express');
const ZringottsCircuit = require('./quickstart/zringotts-helper');

app.post('/api/create-position', async (req, res) => {
  const { lend, borrow, price } = req.body;
  
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  const note = circuit.createNote(
    lend, borrow, price,
    Date.now(),
    crypto.randomBytes(32),
    crypto.randomBytes(32)
  );
  
  res.json({
    success: true,
    noteHash: note.hash,
    root: circuit.merkleTree.root
  });
});
```

## 🔒 Privacy Features

- **Nullifiers:** Keep secret, prevents double-spending
- **Nonces:** Random values for unlinkability
- **Merkle Proofs:** Prove inclusion without revealing position
- **ZK Witnesses:** Prove validity without revealing amounts

## 📝 Notes

- **Tree Levels = 2:** Max 4 positions (matches circuit)
- **Same Timestamp:** Examples use same time to avoid interest complexity
- **Real Production:** Would use different timestamps + handle interest
- **Interest Rates:** Lend 2%, Borrow 5% annual (hardcoded in circuit)
- **LTV Max:** 50% (hardcoded in circuit)

## 🐛 Common Issues

**Problem:** "Note not found in tree"
- **Fix:** Insert previous note first: `circuit.insertNote(prevNote)`

**Problem:** "LTV check failed"  
- **Fix:** Reduce borrow amount or increase collateral

**Problem:** "Witness generation failed"
- **Fix:** Check timestamp is not 0, verify token movements

**Problem:** Module not found
- **Fix:** Run `pnpm install` from circuits/ folder

---

**Created:** April 8, 2026  
**Status:** ✅ All examples tested and working  
**Files:** 8 generated outputs (4 inputs + 4 witnesses)
