/**
 * Simple Standalone Example
 * Shows how to use Zringotts circuit with minimal code
 */

const ZringottsCircuit = require('./zringotts-helper');

async function simpleLendingExample() {
  // 1. Initialize
  const circuit = new ZringottsCircuit();
  await circuit.init();
  console.log("✅ Circuit ready!\n");
  
  // 2. Create your lending position
  console.log("📝 Creating lending position...");
  const myNote = circuit.createNote(
    1000,   // I'm depositing 1000 tokens as collateral
    500,    // I want to borrow 500 tokens
    2500,   // Liquidate if price drops to 2500
    Date.now(),  // Current timestamp
    Math.floor(Math.random() * 1000000),  // Random nullifier (keep secret!)
    Math.floor(Math.random() * 1000000)   // Random nonce
  );
  
  console.log(`   Note hash: ${myNote.hash.slice(0, 20)}...`);
  console.log(`   Collateral: ${myNote.lend_amt}`);
  console.log(`   Borrowed: ${myNote.borrow_amt}`);
  console.log(`   LTV: ${(myNote.borrow_amt * 100 / (myNote.lend_amt * myNote.will_liq_price)).toFixed(4)}%\n`);
  
  // 3. Generate circuit input
  console.log("⚙️  Generating circuit input...");
  const input = circuit.generateInitialNoteInput(
    myNote,
    1000,  // Depositing 1000 tokens
    500    // Borrowing 500 tokens
  );
  
  const inputFile = circuit.saveInput(input, "my_lending_position.json");
  console.log("");
  
  // 4. Generate zero-knowledge proof (witness)
  console.log("🔐 Generating zero-knowledge witness...");
  const success = await circuit.generateWitness(
    inputFile,
    "my_witness.wtns"
  );
  
  if (success) {
    console.log("✅ Success! Your lending position is proven.\n");
    console.log("Files created:");
    console.log("  📄 my_lending_position.json - Circuit input");
    console.log("  🔒 my_witness.wtns - ZK witness (proof)\n");
    
    // 5. Add to Merkle tree
    circuit.insertNote(myNote);
    circuit.printTree();
    
    console.log("🎉 Done! You can now use this witness to generate a zkSNARK proof.");
    console.log("");
    console.log("Next steps:");
    console.log("  • Use snarkjs to generate a full proof");
    console.log("  • Submit proof to smart contract");
    console.log("  • Your position remains private! 🔒");
  } else {
    console.log("❌ Failed to generate witness");
  }
}

// Run it!
if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════╗
║  Simple Zringotts Circuit Example         ║
║  Create a private lending position        ║
╚═══════════════════════════════════════════════╝
`);
  
  simpleLendingExample()
    .then(() => {
      // Check if --clean flag is passed
      const shouldClean = process.argv.includes('--clean') || process.argv.includes('-c');
      
      if (shouldClean) {
        const fs = require('fs');
        const path = require('path');
        
        console.log("🧹 Cleaning up generated files...");
        const files = ['my_lending_position.json', 'my_witness.wtns']
          .filter(f => fs.existsSync(path.join(__dirname, f)));
        
        files.forEach(f => {
          fs.unlinkSync(path.join(__dirname, f));
        });
        
        console.log(`✅ Deleted ${files.length} generated files`);
        console.log("");
      } else {
        console.log("");
        console.log("💡 Tip: Run with --clean to auto-delete generated files");
        console.log("   Example: node simple.js --clean");
      }
    })
    .catch(console.error);
}

module.exports = simpleLendingExample;
