#!/usr/bin/env node

/**
 * Quick Start Runner
 * Run all Zringotts Circuit examples
 */

const { runAllExamples } = require('./examples');

console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🏦 Zringotts Circuit - Quick Start 🏦         ║
║                                                       ║
║  Zero-Knowledge Lending Protocol Circuit Examples    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);

console.log("This will run 4 complete examples:");
console.log("  1️⃣  Initial Deposit - Create lending position");
console.log("  2️⃣  Add Collateral - Improve LTV ratio");
console.log("  3️⃣  Borrow More - Take additional loan");
console.log("  4️⃣  Repay Debt - Pay back borrowed tokens");
console.log("");
console.log("Each example will:");
console.log("  ✓ Create notes with Poseidon hashing");
console.log("  ✓ Generate Merkle proofs");
console.log("  ✓ Create circuit inputs");
console.log("  ✓ Generate witnesses");
console.log("");

runAllExamples()
  .then(() => {
    console.log("📚 Generated files:");
    console.log("   - input_example*.json (circuit inputs)");
    console.log("   - witness_example*.wtns (generated witnesses)");
    console.log("");
    
    // Check if --clean flag is passed
    const shouldClean = process.argv.includes('--clean') || process.argv.includes('-c');
    
    if (shouldClean) {
      const fs = require('fs');
      const path = require('path');
      
      console.log("🧹 Cleaning up generated files...");
      const files = fs.readdirSync(__dirname).filter(f => 
        f.endsWith('.json') || f.endsWith('.wtns')
      );
      
      files.forEach(f => {
        fs.unlinkSync(path.join(__dirname, f));
      });
      
      console.log(`✅ Deleted ${files.length} generated files`);
      console.log("");
    } else {
      console.log("💡 Tip: Run with --clean flag to auto-delete generated files");
      console.log("   Example: node run.js --clean");
      console.log("");
    }
    
    console.log("📖 See quickstart/README.md for more details");
    console.log("");
    process.exit(0);
  })
  .catch(error => {
    console.error("\n❌ Error running examples:", error);
    process.exit(1);
  });
