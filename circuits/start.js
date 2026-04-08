#!/usr/bin/env node

/**
 * Zringotts Circuit - Easy Launcher
 * Quick access to all quickstart examples
 */

const { exec } = require('child_process');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║         🏦 Zringotts Circuit Quickstart 🏦          ║
║                                                      ║
║     Real examples with circomlibjs + Merkle tree    ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
`);

console.log("Choose an option:\n");
console.log("  1. 🚀 Run all 4 examples");
console.log("  2. ✨ Run simple example");
console.log("  3. 📖 View documentation");
console.log("  4. 📁 List generated files");
console.log("");

const args = process.argv.slice(2);
const choice = args[0] || '1';

switch(choice) {
  case '1':
  case 'all':
    console.log("Running all examples...\n");
    exec('node quickstart/run.js', { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
    });
    break;
    
  case '2':
  case 'simple':
    console.log("Running simple example...\n");
    exec('node quickstart/simple.js', { cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
    });
    break;
    
  case '3':
  case 'docs':
    console.log("Documentation:\n");
    console.log("  📘 quickstart/README.md  - Complete API reference");
    console.log("  📘 quickstart/INDEX.md   - File index & quick ref");
    console.log("  📘 QUICKSTART_SUMMARY.md - Overview");
    console.log("");
    console.log("Read with: cat quickstart/README.md\n");
    break;
    
  case '4':
  case 'list':
    console.log("Generated files:\n");
    exec('ls -lh quickstart/*.json quickstart/*.wtns 2>/dev/null', { cwd: __dirname }, (err, stdout) => {
      if (!err && stdout) {
        console.log(stdout);
      } else {
        console.log("No files generated yet. Run examples first!");
      }
      console.log("");
    });
    break;
    
  default:
    console.log(`Unknown option: ${choice}\n`);
    console.log("Usage:");
    console.log("  node start.js [option]\n");
    console.log("Options:");
    console.log("  1, all     - Run all examples");
    console.log("  2, simple  - Run simple example");
    console.log("  3, docs    - View documentation");
    console.log("  4, list    - List generated files\n");
}
