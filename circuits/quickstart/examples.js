const ZringottsCircuit = require('./zringotts-helper');

/**
 * Example 1: Create initial lending position
 */
async function example1_InitialDeposit() {
  console.log("═══════════════════════════════════════════════════");
  console.log("Example 1: Create Initial Lending Position");
  console.log("═══════════════════════════════════════════════════\n");
  
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  // Step 1: Create a new note
  console.log("Step 1: Create note with deposit...");
  const note1 = circuit.createNote(
    500,    // lend_amt: deposit 500 tokens
    1500,   // borrow_amt: borrow 1500 tokens
    2800,   // will_liq_price: liquidation price 2800
    123,    // timestamp
    112,    // nullifier (secret)
    13      // nonce (random)
  );
  
  console.log(`✅ Note created:`);
  console.log(`   Hash: ${note1.hash}`);
  console.log(`   Lend: ${note1.lend_amt}, Borrow: ${note1.borrow_amt}`);
  console.log(`   LTV: ${(note1.borrow_amt * 100 / (note1.lend_amt * note1.will_liq_price)).toFixed(2)}%\n`);
  
  // Step 2: Generate circuit input
  console.log("Step 2: Generate circuit input...");
  const input = circuit.generateInitialNoteInput(
    note1,
    500,   // lend_token_in: depositing 500
    1500   // borrow_token_in: borrowing 1500
  );
  
  const inputFile = circuit.saveInput(input, "input_example1.json");
  
  // Step 3: Generate witness
  console.log("\nStep 3: Generate witness...");
  const success = await circuit.generateWitness(
    inputFile,
    "witness_example1.wtns"
  );
  
  if (success) {
    // Step 4: Insert note into tree
    console.log("Step 4: Insert note into Merkle tree...");
    circuit.insertNote(note1);
    circuit.printTree();
    
    console.log("✅ Example 1 completed successfully!\n");
    return { circuit, note1 };
  }
  
  return null;
}

/**
 * Example 2: Add more collateral to existing position
 */
async function example2_AddCollateral() {
  console.log("═══════════════════════════════════════════════════");
  console.log("Example 2: Add More Collateral");
  console.log("═══════════════════════════════════════════════════\n");
  
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  // First create initial position
  console.log("Setup: Create initial position...");
  const prevNote = circuit.createNote(500, 1500, 2800, 123, 112, 13);
  circuit.insertNote(prevNote);
  console.log("");
  
  // Now add more collateral
  console.log("Step 1: Create updated note with more collateral...");
  const newNote = circuit.createNote(
    1000,   // lend_amt: 500 + 500 more
    1500,   // borrow_amt: same
    2800,   // will_liq_price: same
    123,    // timestamp: SAME as prev (no interest accrual for simplicity)
    999,    // new nullifier
    888     // new nonce
  );
  
  console.log(`✅ New note created:`);
  console.log(`   Lend: ${prevNote.lend_amt} → ${newNote.lend_amt} (+${newNote.lend_amt - prevNote.lend_amt})`);
  console.log(`   Borrow: ${newNote.borrow_amt} (unchanged)`);
  console.log(`   New LTV: ${(newNote.borrow_amt * 100 / (newNote.lend_amt * newNote.will_liq_price)).toFixed(2)}%\n`);
  
  // Step 2: Generate circuit input
  console.log("Step 2: Generate circuit input...");
  const input = circuit.generateUpdateNoteInput(
    prevNote,
    newNote,
    {
      lend_token_in: 500,  // Depositing 500 more
      lend_token_out: 0,
      borrow_token_in: 0,
      borrow_token_out: 0
    }
  );
  
  const inputFile = circuit.saveInput(input, "input_example2.json");
  
  // Step 3: Generate witness
  console.log("\nStep 3: Generate witness...");
  const success = await circuit.generateWitness(
    inputFile,
    "witness_example2.wtns"
  );
  
  if (success) {
    circuit.insertNote(newNote);
    circuit.printTree();
    console.log("✅ Example 2 completed successfully!\n");
    return { circuit, prevNote, newNote };
  }
  
  return null;
}

/**
 * Example 3: Borrow more tokens
 */
async function example3_BorrowMore() {
  console.log("═══════════════════════════════════════════════════");
  console.log("Example 3: Borrow More Tokens");
  console.log("═══════════════════════════════════════════════════\n");
  
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  // Setup
  console.log("Setup: Create initial position...");
  const prevNote = circuit.createNote(1000, 1500, 2800, 123, 999, 888);
  circuit.insertNote(prevNote);
  console.log("");
  
  // Borrow more
  console.log("Step 1: Create note borrowing more tokens...");
  const newNote = circuit.createNote(
    1000,   // lend_amt: same
    2000,   // borrow_amt: 1500 + 500 more
    2800,   // will_liq_price: same
    123,    // timestamp: same (no interest)
    1111,   // new nullifier
    2222    // new nonce
  );
  
  console.log(`✅ New note created:`);
  console.log(`   Lend: ${newNote.lend_amt} (unchanged)`);
  console.log(`   Borrow: ${prevNote.borrow_amt} → ${newNote.borrow_amt} (+${newNote.borrow_amt - prevNote.borrow_amt})`);
  console.log(`   New LTV: ${(newNote.borrow_amt * 100 / (newNote.lend_amt * newNote.will_liq_price)).toFixed(2)}%\n`);
  
  // Generate input
  console.log("Step 2: Generate circuit input...");
  const input = circuit.generateUpdateNoteInput(
    prevNote,
    newNote,
    {
      lend_token_in: 0,
      lend_token_out: 0,
      borrow_token_in: 500,  // Borrowing 500 more
      borrow_token_out: 0
    }
  );
  
  const inputFile = circuit.saveInput(input, "input_example3.json");
  
  // Generate witness
  console.log("\nStep 3: Generate witness...");
  const success = await circuit.generateWitness(
    inputFile,
    "witness_example3.wtns"
  );
  
  if (success) {
    circuit.insertNote(newNote);
    circuit.printTree();
    console.log("✅ Example 3 completed successfully!\n");
  }
}

/**
 * Example 4: Repay debt
 */
async function example4_RepayDebt() {
  console.log("═══════════════════════════════════════════════════");
  console.log("Example 4: Repay Debt");
  console.log("═══════════════════════════════════════════════════\n");
  
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  // Setup
  console.log("Setup: Create position with debt...");
  const prevNote = circuit.createNote(1000, 2000, 2800, 123, 1111, 2222);
  circuit.insertNote(prevNote);
  console.log("");
  
  // Repay
  console.log("Step 1: Create note after repaying debt...");
  const newNote = circuit.createNote(
    1000,   // lend_amt: same
    1000,   // borrow_amt: 2000 - 1000 repaid
    2800,   // will_liq_price: same (can be 0 if fully repaid)
    123,    // timestamp: same (no interest)
    3333,   // new nullifier
    4444    // new nonce
  );
  
  console.log(`✅ New note created:`);
  console.log(`   Lend: ${newNote.lend_amt} (unchanged)`);
  console.log(`   Borrow: ${prevNote.borrow_amt} → ${newNote.borrow_amt} (-${prevNote.borrow_amt - newNote.borrow_amt} repaid)`);
  console.log(`   New LTV: ${(newNote.borrow_amt * 100 / (newNote.lend_amt * newNote.will_liq_price)).toFixed(2)}%\n`);
  
  // Generate input
  console.log("Step 2: Generate circuit input...");
  const input = circuit.generateUpdateNoteInput(
    prevNote,
    newNote,
    {
      lend_token_in: 0,
      lend_token_out: 0,
      borrow_token_in: 0,
      borrow_token_out: 1000  // Repaying 1000
    }
  );
  
  const inputFile = circuit.saveInput(input, "input_example4.json");
  
  // Generate witness
  console.log("\nStep 3: Generate witness...");
  const success = await circuit.generateWitness(
    inputFile,
    "witness_example4.wtns"
  );
  
  if (success) {
    circuit.insertNote(newNote);
    circuit.printTree();
    console.log("✅ Example 4 completed successfully!\n");
  }
}

// Run all examples
async function runAllExamples() {
  console.log("\n🚀 Running all Zringotts Circuit examples...\n");
  
  await example1_InitialDeposit();
  await example2_AddCollateral();
  await example3_BorrowMore();
  await example4_RepayDebt();
  
  console.log("═══════════════════════════════════════════════════");
  console.log("🎉 All examples completed!");
  console.log("═══════════════════════════════════════════════════\n");
}

// Run if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

module.exports = {
  example1_InitialDeposit,
  example2_AddCollateral,
  example3_BorrowMore,
  example4_RepayDebt,
  runAllExamples
};
