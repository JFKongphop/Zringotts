#!/usr/bin/env node

/**
 * Run & Clean - Execute examples and auto-cleanup
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

const QUICKSTART_DIR = __dirname;

async function cleanGeneratedFiles() {
  const files = fs.readdirSync(QUICKSTART_DIR).filter(f => 
    f.endsWith('.json') || f.endsWith('.wtns')
  );
  
  if (files.length === 0) {
    console.log("✨ No generated files to clean");
    return 0;
  }
  
  console.log(`🧹 Cleaning ${files.length} generated files...`);
  files.forEach(f => {
    fs.unlinkSync(path.join(QUICKSTART_DIR, f));
    console.log(`   ✓ Deleted ${f}`);
  });
  
  return files.length;
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'help';
  
  console.log(`
╔══════════════════════════════════════════════════════╗
║       🏦 Zringotts - Run & Clean Helper 🏦          ║
╚══════════════════════════════════════════════════════╝
`);
  
  switch(mode) {
    case 'all':
    case 'examples':
      console.log("🚀 Running all examples...\n");
      try {
        const { stdout } = await execPromise('node run.js', { cwd: QUICKSTART_DIR });
        console.log(stdout);
        
        console.log("\n🧹 Auto-cleaning generated files...\n");
        const count = await cleanGeneratedFiles();
        console.log(`\n✅ Cleaned up ${count} files`);
      } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
      }
      break;
      
    case 'simple':
      console.log("✨ Running simple example...\n");
      try {
        const { stdout } = await execPromise('node simple.js', { cwd: QUICKSTART_DIR });
        console.log(stdout);
        
        console.log("\n🧹 Auto-cleaning generated files...\n");
        const count = await cleanGeneratedFiles();
        console.log(`\n✅ Cleaned up ${count} files`);
      } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
      }
      break;
      
    case 'clean':
      console.log("🧹 Cleaning up generated files...\n");
      const count = await cleanGeneratedFiles();
      console.log(`\n✅ Cleaned up ${count} files`);
      break;
      
    case 'list':
      console.log("📁 Generated files:\n");
      const files = fs.readdirSync(QUICKSTART_DIR).filter(f => 
        f.endsWith('.json') || f.endsWith('.wtns')
      );
      
      if (files.length === 0) {
        console.log("   (none)");
      } else {
        files.forEach(f => {
          const stats = fs.statSync(path.join(QUICKSTART_DIR, f));
          const size = (stats.size / 1024).toFixed(1);
          console.log(`   ${f.endsWith('.wtns') ? '🔒' : '📄'} ${f} (${size} KB)`);
        });
      }
      console.log("");
      break;
      
    case 'help':
    case '--help':
    case '-h':
    default:
      console.log("Usage: node run-clean.js [command]\n");
      console.log("Commands:");
      console.log("  all, examples  - Run all examples, then auto-clean");
      console.log("  simple         - Run simple example, then auto-clean");
      console.log("  clean          - Just clean generated files");
      console.log("  list           - List generated files");
      console.log("  help           - Show this help\n");
      console.log("Examples:");
      console.log("  node run-clean.js all      # Run & clean");
      console.log("  node run-clean.js simple   # Run simple & clean");
      console.log("  node run-clean.js clean    # Just clean");
      console.log("  node run-clean.js list     # Show files\n");
      console.log("Alternative (built-in flags):");
      console.log("  node run.js --clean        # Run all with auto-clean");
      console.log("  node simple.js --clean     # Run simple with auto-clean\n");
      break;
  }
}

main().catch(console.error);
