# 🧹 Cleanup Guide - Managing Generated Files

When you run examples, the circuit generates **10 files** (~2.1 MB total):
- 5 JSON input files (circuit inputs)
- 5 WTNS witness files (zero-knowledge witnesses)

This guide shows you all the ways to clean them up.

---

## 🚀 Method 1: Run-Clean Wrapper (Recommended)

The `run-clean.js` script provides the easiest workflow.

### Run Examples + Auto-Cleanup

```bash
# Run all 4 examples, then clean up
node run-clean.js all

# Run simple example, then clean up
node run-clean.js simple
```

**What happens:**
1. ✅ Runs the example(s)
2. ✅ Shows output
3. 🧹 Automatically deletes all `.json` and `.wtns` files
4. ✅ Shows cleanup summary

### Just Cleanup

```bash
# Clean up without running
node run-clean.js clean
```

**Output example:**
```
🧹 Cleaning 10 generated files...
   ✓ Deleted input_example1.json
   ✓ Deleted input_example2.json
   ✓ Deleted input_example3.json
   ✓ Deleted input_example4.json
   ✓ Deleted my_lending_position.json
   ✓ Deleted witness_example1.wtns
   ✓ Deleted witness_example2.wtns
   ✓ Deleted witness_example3.wtns
   ✓ Deleted witness_example4.wtns
   ✓ Deleted my_witness.wtns

✅ Cleaned up 10 files
```

### List Generated Files

```bash
# See what files exist before cleaning
node run-clean.js list
```

**Output example:**
```
📁 Generated files:

   📄 input_example1.json (1.1 KB)
   📄 input_example2.json (1.1 KB)
   📄 input_example3.json (1.1 KB)
   📄 input_example4.json (1.1 KB)
   📄 my_lending_position.json (1.1 KB)
   🔒 witness_example1.wtns (429.0 KB)
   🔒 witness_example2.wtns (429.0 KB)
   🔒 witness_example3.wtns (429.0 KB)
   🔒 witness_example4.wtns (429.0 KB)
   🔒 my_witness.wtns (429.0 KB)
```

### Help Command

```bash
node run-clean.js help
```

---

## ⚡ Method 2: Built-in Flags

Both `run.js` and `simple.js` support the `--clean` flag.

### Run All Examples + Cleanup

```bash
node run.js --clean
# or
node run.js -c
```

**What happens:**
1. ✅ Runs all 4 examples
2. ✅ Generates witnesses
3. 🧹 Deletes all `.json` and `.wtns` files in quickstart/

### Run Simple Example + Cleanup

```bash
node simple.js --clean
# or
node simple.js -c
```

**What happens:**
1. ✅ Runs simple example
2. ✅ Generates witness
3. 🧹 Deletes only `my_lending_position.json` and `my_witness.wtns`

---

## 🔧 Method 3: Manual Cleanup Script

Use the provided `clean.sh` script.

```bash
bash clean.sh
```

**What it does:**
```bash
#!/bin/bash
rm -f *.json *.wtns
echo "✅ Cleaned up generated files"
```

**Pros:**
- ✅ Simple one-liner
- ✅ Quick to run
- ✅ Unix-style

**Cons:**
- ❌ Only works on Unix/Mac/Linux
- ❌ No verbose output
- ❌ Deletes ALL .json/.wtns files

---

## 🛠️ Method 4: Manual Commands

If you prefer to do it manually:

### Delete All Generated Files

```bash
# Unix/Mac/Linux
rm *.json *.wtns

# Windows (PowerShell)
Remove-Item *.json, *.wtns

# Windows (CMD)
del *.json *.wtns
```

### Delete Specific Files

```bash
# Only example outputs
rm input_example*.json witness_example*.wtns

# Only simple example
rm my_lending_position.json my_witness.wtns
```

---

## 📊 File Summary

| File | Size | What Is It? |
|------|------|-------------|
| `input_example1.json` | 1.1 KB | Circuit input for Example 1 |
| `input_example2.json` | 1.1 KB | Circuit input for Example 2 |
| `input_example3.json` | 1.1 KB | Circuit input for Example 3 |
| `input_example4.json` | 1.1 KB | Circuit input for Example 4 |
| `my_lending_position.json` | 1.1 KB | Simple example input |
| `witness_example1.wtns` | 429 KB | Zero-knowledge witness #1 |
| `witness_example2.wtns` | 429 KB | Zero-knowledge witness #2 |
| `witness_example3.wtns` | 429 KB | Zero-knowledge witness #3 |
| `witness_example4.wtns` | 429 KB | Zero-knowledge witness #4 |
| `my_witness.wtns` | 429 KB | Simple example witness |

**Total:** ~2.1 MB

---

## 🎯 Which Method Should I Use?

| Scenario | Recommended Method |
|----------|-------------------|
| **Daily usage** | `node run-clean.js all` |
| **Quick test** | `node run.js --clean` |
| **Simple example** | `node simple.js --clean` |
| **Just cleanup** | `node run-clean.js clean` |
| **Check files first** | `node run-clean.js list` |
| **Manual control** | `bash clean.sh` or `rm` |

---

## 🔍 Git Integration

The `.gitignore` is already configured:

```gitignore
# Generated circuit files
*.json
*.wtns

# But keep configs
!package.json
```

**This means:**
- ✅ Generated files won't be committed
- ✅ You can safely run examples
- ✅ No manual cleanup needed for git

---

## 💡 Pro Tips

### Tip 1: Default to Run-Clean
Always use the run-clean wrapper for the cleanest workflow:
```bash
node run-clean.js all
```

### Tip 2: Check Before Cleaning
Use `list` to see what you're about to delete:
```bash
node run-clean.js list
node run-clean.js clean
```

### Tip 3: Keep One for Reference
If you want to keep one example output:
```bash
# Run and clean
node run-clean.js all

# Then run one again manually
node examples.js  # Keeps example 1-4 outputs
```

### Tip 4: Custom Scripts
Create your own cleanup script:
```bash
# my-workflow.sh
node run.js
# Do something with witnesses
snarkjs groth16 prove ...
# Then cleanup
bash clean.sh
```

---

## ❓ FAQ

**Q: Will cleanup delete my source files?**  
A: No. Only `.json` and `.wtns` files in `quickstart/` are deleted. Your `.js` files are safe.

**Q: Can I prevent cleanup?**  
A: Yes. Just don't use the `--clean` flag or run-clean.js.

**Q: What if I want to keep witnesses?**  
A: Don't use cleanup methods. Or copy them elsewhere first.

**Q: Does .gitignore mean files are auto-deleted?**  
A: No. `.gitignore` only prevents committing to git. Files stay on disk until you clean them.

**Q: Can I clean while examples are running?**  
A: No. Wait for examples to finish. run-clean.js handles this automatically.

---

## 🎓 Summary

**Easiest:** `node run-clean.js all`  
**Built-in:** `node run.js --clean`  
**Manual:** `bash clean.sh`  
**Selective:** Delete specific files

Choose what works best for your workflow! 🚀

---

Made with ❤️ for Zringotts Protocol
