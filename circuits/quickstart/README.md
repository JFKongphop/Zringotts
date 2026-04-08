# 🚀 Zringotts Circuit - Quick Start

Complete examples using **circomlibjs** and **fixed-merkle-tree** for real-world usage.

## 📦 What's Included

| File | Description |
|------|-------------|
| `zringotts-helper.js` | Main helper class with Poseidon hashing & Merkle tree |
| `examples.js` | 4 complete examples (deposit, add collateral, borrow, repay) |
| `run.js` | Simple script to run examples |
| `simple.js` | Minimal standalone example |
| `run-clean.js` | Run examples with automatic cleanup |
| `clean.sh` | Manual cleanup script |

## ⚡ Quick Start

```bash
# Run all examples with auto-cleanup (recommended)
node quickstart/run-clean.js all

# Or run without cleanup
node quickstart/run.js

# Run simple example with cleanup
node quickstart/run-clean.js simple

# Or individual examples
node quickstart/examples.js
```

## 📚 Examples

### Example 1: Initial Deposit
Create a lending position by depositing collateral and borrowing tokens.

```javascript
const circuit = new ZringottsCircuit();
await circuit.init();

const note = circuit.createNote(
  500,    // deposit 500 tokens
  1500,   // borrow 1500 tokens  
  2800,   // liquidation price
  123,    // timestamp
  112,    // nullifier (secret)
  13      // nonce
);

const input = circuit.generateInitialNoteInput(note, 500, 1500);
await circuit.generateWitness(inputFile, outputFile);
```

### Example 2: Add Collateral
Add more collateral to improve your LTV ratio.

```javascript
const newNote = circuit.createNote(
  1000,   // 500 + 500 more collateral
  1500,   // same debt
  2800, 200, 999, 888
);

const input = circuit.generateUpdateNoteInput(prevNote, newNote, {
  lend_token_in: 500  // depositing 500 more
});
```

### Example 3: Borrow More
Borrow additional tokens against your collateral.

```javascript
const newNote = circuit.createNote(
  1000,   // same collateral
  2000,   // +500 more debt
  2800, 300, 1111, 2222
);

const input = circuit.generateUpdateNoteInput(prevNote, newNote, {
  borrow_token_in: 500  // borrowing 500 more
});
```

### Example 4: Repay Debt
Pay back borrowed tokens to reduce debt.

```javascript
const newNote = circuit.createNote(
  1000,   // same collateral
  1000,   // -1000 debt repaid
  2800, 400, 3333, 4444
);

const input = circuit.generateUpdateNoteInput(prevNote, newNote, {
  borrow_token_out: 1000  // repaying 1000
});
```

## 🎯 Key Features

### ✅ Proper Merkle Tree
Uses `fixed-merkle-tree` for real Merkle proof generation:
- Automatic path calculation
- Correct sibling nodes
- Valid inclusion proofs

### ✅ Poseidon Hashing
Uses `circomlibjs` for cryptographic hashing:
- Hash notes (6 elements)
- Hash Merkle nodes (2 elements)
- Compatible with circuit

### ✅ Automatic Validation
- LTV ratio checks
- Token movement validation
- Merkle proof generation
- Circuit input formatting

## 📖 API Reference

### ZringottsCircuit Class

#### `new ZringottsCircuit()`
Create new instance.

#### `await init()`
Initialize Poseidon hasher and Merkle tree.

#### `createNote(lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce)`
Create a new note with LTV validation.

**Returns:** `{ hash, lend_amt, borrow_amt, ... }`

#### `insertNote(note)`
Insert note into Merkle tree.

**Returns:** `{ index, root }`

#### `getMerkleProof(noteHash)`
Get inclusion proof for a note.

**Returns:** `{ index, pathElements, pathIndices, root }`

#### `generateInitialNoteInput(newNote, lend_token_in, borrow_token_in)`
Generate circuit input for first deposit.

**Returns:** Circuit input JSON

#### `generateUpdateNoteInput(prevNote, newNote, tokenMovements)`
Generate circuit input for updating existing position.

**Parameters:**
- `prevNote` - Previous note object
- `newNote` - New note object
- `tokenMovements` - `{ lend_token_in, lend_token_out, borrow_token_in, borrow_token_out }`

**Returns:** Circuit input JSON

#### `await generateWitness(inputFile, outputFile)`
Run witness generation using the circuit.

**Returns:** `true` on success

#### `saveInput(input, filename)`
Save circuit input to JSON file.

#### `printTree()`
Print current Merkle tree state.

## 🧪 Testing Your Own Scenarios

```javascript
const ZringottsCircuit = require('./quickstart/zringotts-helper');

async function myScenario() {
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  // 1. Create note
  const note = circuit.createNote(
    1000,   // your lend amount
    3000,   // your borrow amount
    2500,   // liquidation price
    Date.now(),
    Math.floor(Math.random() * 1000000),
    Math.floor(Math.random() * 1000000)
  );
  
  // 2. Generate input
  const input = circuit.generateInitialNoteInput(note, 1000, 3000);
  const inputFile = circuit.saveInput(input, "my_input.json");
  
  // 3. Generate witness
  await circuit.generateWitness(inputFile, "my_witness.wtns");
  
  // 4. Insert into tree
  circuit.insertNote(note);
  circuit.printTree();
}

myScenario();
```

## 🔍 Constraints

### LTV (Loan-to-Value) Ratio
```
borrow_amt * 100 ≤ 50 * lend_amt * will_liq_price
```

**Max LTV:** 50%

### Interest Rates
- **Lend:** 2% annual
- **Borrow:** 5% annual

### Token Movements
- Mutually exclusive: can't deposit AND withdraw in same transaction
- Must match note changes

## 📊 File Outputs

After running examples, you'll have:

```
quickstart/
├── input_example1.json      (Circuit input)
├── input_example2.json
├── input_example3.json
├── input_example4.json
├── witness_example1.wtns    (Generated witness ~429KB)
├── witness_example2.wtns
├── witness_example3.wtns
└── witness_example4.wtns
```

## 🧹 Cleanup Options

### Method 1: Auto-cleanup wrapper (Recommended)
```bash
# Run examples and auto-clean
node quickstart/run-clean.js all

# Run simple example and auto-clean
node quickstart/run-clean.js simple

# Just clean up files
node quickstart/run-clean.js clean

# List generated files
node quickstart/run-clean.js list
```

### Method 2: Built-in flags
```bash
# Run with auto-cleanup
node quickstart/run.js --clean
node quickstart/simple.js --clean
```

### Method 3: Manual cleanup
```bash
# Unix/Mac/Linux
bash quickstart/clean.sh

# Or manually delete
rm quickstart/*.json quickstart/*.wtns
```

**Note:** The `.gitignore` is already configured to ignore generated `.json` and `.wtns` files.

## 🛠️ Integration

### For Web Apps
```javascript
// Import in browser (with bundler)
import ZringottsCircuit from './zringotts-helper.js';

const circuit = new ZringottsCircuit();
await circuit.init();
```

### For Backend
```javascript
// Node.js server
const ZringottsCircuit = require('./zringotts-helper.js');

app.post('/create-position', async (req, res) => {
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  const note = circuit.createNote(/* ... */);
  const input = circuit.generateInitialNoteInput(/* ... */);
  
  res.json({ noteHash: note.hash, input });
});
```

## 🎓 Next Steps

1. **Run examples:** `node quickstart/run.js`
2. **Modify values:** Edit `examples.js` to test different scenarios
3. **Create custom scenarios:** Use the helper class in your own scripts
4. **Generate proofs:** Use snarkjs with generated witnesses

## 📝 Notes

- Merkle tree has **2 levels** (4 leaf capacity) - matches circuit
- All hashes use **Poseidon** hash function
- Timestamps prevent division by zero (min: 1)
- Nullifiers and nonces should be random for privacy

## 🐛 Troubleshooting

**LTV Error:** Your borrow amount is too high relative to collateral
```javascript
// Fix: reduce borrow amount or increase collateral
const note = circuit.createNote(
  1000,   // increase this
  1000,   // or decrease this
  2800, ...
);
```

**Note not found:** Trying to update note that wasn't inserted
```javascript
// Fix: insert note first
circuit.insertNote(prevNote);
```

**Witness failed:** Circuit constraints not satisfied
- Check LTV ratio
- Verify token movements match note changes
- Ensure merkle proof is valid

---

Made with ❤️ for Zringotts Protocol
