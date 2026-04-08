const { buildPoseidon } = require("circomlibjs");
const { MerkleTree } = require("fixed-merkle-tree");
const fs = require("fs");
const path = require("path");

/**
 * Zringotts Circuit Helper
 * Complete example using circomlibjs + fixed-merkle-tree
 */

class ZringottsCircuit {
  constructor() {
    this.poseidon = null;
    this.merkleTree = null;
    this.TREE_LEVELS = 2; // Must match circuit parameter
    this.notes = new Map(); // Store notes by hash
  }

  async init() {
    this.poseidon = await buildPoseidon();
    this.F = this.poseidon.F;
    
    // Initialize empty Merkle tree
    this.merkleTree = new MerkleTree(this.TREE_LEVELS, [], {
      hashFunction: (left, right) => this.hash2(left, right),
      zeroElement: "0"
    });
    
    console.log("✅ Zringotts Circuit initialized");
    console.log(`   Tree levels: ${this.TREE_LEVELS}`);
    console.log(`   Root: ${this.merkleTree.root}\n`);
  }

  // Hash 2 elements (for Merkle tree)
  hash2(left, right) {
    const hash = this.poseidon([BigInt(left), BigInt(right)]);
    return this.F.toString(hash);
  }

  // Calculate amount with interest
  calculateWithInterest(amount, prevTimestamp, currTimestamp, interestRate) {
    const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
    const timeDiff = currTimestamp - prevTimestamp;
    
    // Formula from circuit: (ONE_YEAR_SECONDS + interestRate * timeDiff) * amount / ONE_YEAR_SECONDS
    const numerator = (ONE_YEAR_SECONDS + interestRate * timeDiff) * amount;
    return Math.floor(numerator / ONE_YEAR_SECONDS);
  }

  // Hash a note (6 elements)
  hashNote(note) {
    const hash = this.poseidon([
      BigInt(note.lend_amt),
      BigInt(note.borrow_amt),
      BigInt(note.will_liq_price),
      BigInt(note.timestamp),
      BigInt(note.nullifier),
      BigInt(note.nonce)
    ]);
    return this.F.toString(hash);
  }

  // Create a new note
  createNote(lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce) {
    const note = {
      lend_amt,
      borrow_amt,
      will_liq_price,
      timestamp,
      nullifier,
      nonce
    };
    
    const hash = this.hashNote(note);
    note.hash = hash;
    
    // Check LTV
    const ltv_check = (borrow_amt * 100) <= (50 * lend_amt * will_liq_price);
    if (!ltv_check) {
      throw new Error(`LTV check failed: ${borrow_amt * 100} > ${50 * lend_amt * will_liq_price}`);
    }
    
    return note;
  }

  // Insert note into Merkle tree
  insertNote(note) {
    this.merkleTree.insert(note.hash);
    this.notes.set(note.hash, note);
    
    console.log(`📝 Inserted note ${note.hash.slice(0, 10)}...`);
    console.log(`   New root: ${this.merkleTree.root}`);
    
    return {
      index: this.merkleTree.elements.length - 1,
      root: this.merkleTree.root
    };
  }

  // Get Merkle proof for a note
  getMerkleProof(noteHash) {
    const index = this.merkleTree.elements.indexOf(noteHash);
    if (index === -1) {
      throw new Error("Note not found in tree");
    }
    
    const { pathElements, pathIndices } = this.merkleTree.path(index);
    
    return {
      index,
      pathElements: pathElements.map(x => x.toString()),
      pathIndices: pathIndices.map(x => x.toString()),
      root: this.merkleTree.root.toString()
    };
  }

  // Generate circuit input for initial note creation
  generateInitialNoteInput(newNote, lend_token_in, borrow_token_in) {
    // Previous note is empty
    const prevNote = {
      lend_amt: 0,
      borrow_amt: 0,
      will_liq_price: 0,
      timestamp: 100, // Non-zero to avoid division by zero
      nullifier: 0,
      nonce: 0
    };
    
    const prevHash = this.hashNote(prevNote);
    
    // Create temporary tree with just the empty note
    const tempTree = new MerkleTree(this.TREE_LEVELS, [prevHash], {
      hashFunction: (left, right) => this.hash2(left, right),
      zeroElement: "0"
    });
    
    const { pathElements, pathIndices } = tempTree.path(0);
    
    const input = {
      // New note
      new_lend_amt: newNote.lend_amt.toString(),
      new_borrow_amt: newNote.borrow_amt.toString(),
      new_will_liq_price: newNote.will_liq_price.toString(),
      new_timestamp: newNote.timestamp.toString(),
      new_nullifier: newNote.nullifier.toString(),
      new_nonce: newNote.nonce.toString(),
      
      // Public inputs
      new_note_hash: newNote.hash,
      root: tempTree.root.toString(),
      
      // Previous note (empty)
      prev_lend_amt: prevNote.lend_amt.toString(),
      prev_borrow_amt: prevNote.borrow_amt.toString(),
      prev_will_liq_price: prevNote.will_liq_price.toString(),
      prev_timestamp: prevNote.timestamp.toString(),
      prev_nullifier: prevNote.nullifier.toString(),
      prev_nonce: prevNote.nonce.toString(),
      
      prev_hash: prevHash,
      prev_index_bits: pathIndices.map(x => x.toString()),
      prev_hash_path: pathElements.map(x => x.toString()),
      
      // Liquidation array (empty)
      liq_price: Array(10).fill("0"),
      liq_timestamp: Array(10).fill("0"),
      
      // Token movements
      lend_token_out: "0",
      borrow_token_out: "0",
      lend_token_in: lend_token_in.toString(),
      borrow_token_in: borrow_token_in.toString()
    };
    
    return input;
  }

  // Generate circuit input for updating existing note
  generateUpdateNoteInput(prevNote, newNote, tokenMovements) {
    if (!this.notes.has(prevNote.hash)) {
      throw new Error("Previous note not found in tree");
    }
    
    const proof = this.getMerkleProof(prevNote.hash);
    
    // Calculate amounts with interest
    const LEND_INTEREST_RATE = 2;
    const BORROW_INTEREST_RATE = 5;
    
    const lendWithInterest = this.calculateWithInterest(
      prevNote.lend_amt,
      prevNote.timestamp,
      newNote.timestamp,
      LEND_INTEREST_RATE
    );
    
    const borrowWithInterest = this.calculateWithInterest(
      prevNote.borrow_amt,
      prevNote.timestamp,
      newNote.timestamp,
      BORROW_INTEREST_RATE
    );
    
    // Validate the new amounts match expected calculations
    const expectedNewLend = lendWithInterest 
      + (tokenMovements.lend_token_in || 0)
      - (tokenMovements.lend_token_out || 0);
    
    const expectedNewBorrow = borrowWithInterest
      + (tokenMovements.borrow_token_in || 0)
      - (tokenMovements.borrow_token_out || 0);
    
    // Circuit enforces: new_lend_amt <= calc_new_lend_amt and calc_new_borrow_amt <= new_borrow_amt
    // So new amounts can be <= expected (allows forfeiting interest)
    if (newNote.lend_amt > expectedNewLend) {
      console.warn(`⚠️  Warning: new_lend_amt (${newNote.lend_amt}) > expected (${expectedNewLend})`);
      console.warn(`   Lend with interest: ${lendWithInterest}, token_in: ${tokenMovements.lend_token_in || 0}, token_out: ${tokenMovements.lend_token_out || 0}`);
    }
    
    if (newNote.borrow_amt < expectedNewBorrow) {
      console.warn(`⚠️  Warning: new_borrow_amt (${newNote.borrow_amt}) < expected (${expectedNewBorrow})`);
      console.warn(`   Borrow with interest: ${borrowWithInterest}, token_in: ${tokenMovements.borrow_token_in || 0}, token_out: ${tokenMovements.borrow_token_out || 0}`);
    }
    
    const input = {
      // New note
      new_lend_amt: newNote.lend_amt.toString(),
      new_borrow_amt: newNote.borrow_amt.toString(),
      new_will_liq_price: newNote.will_liq_price.toString(),
      new_timestamp: newNote.timestamp.toString(),
      new_nullifier: newNote.nullifier.toString(),
      new_nonce: newNote.nonce.toString(),
      
      // Public inputs
      new_note_hash: newNote.hash,
      root: proof.root,
      
      // Previous note
      prev_lend_amt: prevNote.lend_amt.toString(),
      prev_borrow_amt: prevNote.borrow_amt.toString(),
      prev_will_liq_price: prevNote.will_liq_price.toString(),
      prev_timestamp: prevNote.timestamp.toString(),
      prev_nullifier: prevNote.nullifier.toString(),
      prev_nonce: prevNote.nonce.toString(),
      
      prev_hash: prevNote.hash,
      prev_index_bits: proof.pathIndices,
      prev_hash_path: proof.pathElements,
      
      // Liquidation array
      liq_price: (tokenMovements.liq_price || Array(10).fill(0)).map(x => x.toString()),
      liq_timestamp: (tokenMovements.liq_timestamp || Array(10).fill(0)).map(x => x.toString()),
      
      // Token movements
      lend_token_out: (tokenMovements.lend_token_out || 0).toString(),
      borrow_token_out: (tokenMovements.borrow_token_out || 0).toString(),
      lend_token_in: (tokenMovements.lend_token_in || 0).toString(),
      borrow_token_in: (tokenMovements.borrow_token_in || 0).toString()
    };
    
    return input;
  }

  // Save input to JSON file
  saveInput(input, filename) {
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, JSON.stringify(input, null, 2));
    console.log(`💾 Saved input to: ${filename}`);
    return filepath;
  }

  // Generate witness using the circuit
  async generateWitness(inputFile, outputFile) {
    const { exec } = require("child_process");
    const util = require("util");
    const execPromise = util.promisify(exec);
    
    const wasmPath = path.join(__dirname, "../build/zringotts_js/zringotts.wasm");
    const scriptPath = path.join(__dirname, "../build/zringotts_js/generate_witness.js");
    
    try {
      await execPromise(
        `node ${scriptPath} ${wasmPath} ${inputFile} ${outputFile}`
      );
      
      const stats = fs.statSync(outputFile);
      console.log(`✅ Witness generated: ${outputFile}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB\n`);
      return true;
    } catch (error) {
      console.error(`❌ Witness generation failed: ${error.message}`);
      return false;
    }
  }

  // Print tree state
  printTree() {
    console.log("\n📊 Merkle Tree State:");
    console.log(`   Root: ${this.merkleTree.root}`);
    console.log(`   Elements: ${this.merkleTree.elements.length}`);
    this.merkleTree.elements.forEach((hash, idx) => {
      if (hash !== "0") {
        const note = this.notes.get(hash);
        console.log(`   [${idx}] ${hash.slice(0, 10)}... (lend: ${note?.lend_amt}, borrow: ${note?.borrow_amt})`);
      }
    });
    console.log("");
  }
}

module.exports = ZringottsCircuit;

// CLI usage
if (require.main === module) {
  (async () => {
    const circuit = new ZringottsCircuit();
    await circuit.init();
    
    console.log("Zringotts Circuit Helper loaded!");
    console.log("Import this module to use in your scripts.\n");
    console.log("Example:");
    console.log("  const ZringottsCircuit = require('./zringotts-helper.js')");
    console.log("  const circuit = new ZringottsCircuit()");
    console.log("  await circuit.init()");
  })();
}
