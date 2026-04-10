#!/usr/bin/env node

/**
 * Generate ZK proofs for Foundry tests
 * This script generates real proofs and saves them in a format that Foundry can use
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import the helper
const ZringottsCircuit = require('../../circuits/quickstart/zringotts-helper.js');

async function generateTestProofs() {
  console.log('\n🔐 Generating ZK Proofs for Testing\n');
  
  const circuit = new ZringottsCircuit();
  await circuit.init();
  
  const proofs = {};
  
  // ============================================
  // 1. Initial Deposit (Alice deposits 1000 WETH)
  // ============================================
  console.log('📝 Generating Proof 1: Initial Deposit');
  
  const note1 = circuit.createNote({
    lend_amt: 1000,
    borrow_amt: 0,
    will_liq_price: 2500,
    timestamp: Math.floor(Date.now() / 1000)
  });
  
  const input1 = circuit.generateInitialNoteInput(note1, {
    liq_price: Array(10).fill(1),
    liq_timestamp: Array(10).fill(0),
    lend_token_in: 1000,
    lend_token_out: 0,
    borrow_token_in: 0,
    borrow_token_out: 0
  });
  
  circuit.saveInput(input1, 'test_deposit_initial.json');
  await circuit.generateWitness('test_deposit_initial.json', 'test_deposit_initial.wtns');
  
  // Generate proof with snarkjs
  console.log('  Generating Groth16 proof...');
  execSync(
    `snarkjs groth16 prove ../../build/zringotts.zkey test_deposit_initial.wtns test_deposit_initial_proof.json test_deposit_initial_public.json`,
    { cwd: path.join(__dirname) }
  );
  
  const proof1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_deposit_initial_proof.json')));
  const public1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_deposit_initial_public.json')));
  
  proofs.initialDeposit = {
    proof: proof1,
    publicSignals: public1,
    inputs: input1
  };
  
  // Insert note to tree for next operations
  circuit.tree.insert(note1.hash);
  
  // ============================================
  // 2. Borrow (Alice borrows 500 USDC)
  // ============================================
  console.log('📝 Generating Proof 2: Borrow');
  
  const note2 = circuit.createNote({
    lend_amt: 1000,
    borrow_amt: 500,
    will_liq_price: 2500,
    timestamp: Math.floor(Date.now() / 1000)
  });
  
  const input2 = circuit.generateUpdateNoteInput(note1, note2, {
    liq_price: Array(10).fill(1),
    liq_timestamp: Array(10).fill(0),
    lend_token_in: 0,
    lend_token_out: 0,
    borrow_token_in: 500,
    borrow_token_out: 0
  });
  
  circuit.saveInput(input2, 'test_borrow.json');
  await circuit.generateWitness('test_borrow.json', 'test_borrow.wtns');
  
  execSync(
    `snarkjs groth16 prove ../../build/zringotts.zkey test_borrow.wtns test_borrow_proof.json test_borrow_public.json`,
    { cwd: path.join(__dirname) }
  );
  
  const proof2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_borrow_proof.json')));
  const public2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_borrow_public.json')));
  
  proofs.borrow = {
    proof: proof2,
    publicSignals: public2,
    inputs: input2
  };
  
  circuit.tree.insert(note2.hash);
  
  // ============================================
  // 3. Repay (Alice repays 250 USDC)
  // ============================================
  console.log('📝 Generating Proof 3: Repay');
  
  const note3 = circuit.createNote({
    lend_amt: 1000,
    borrow_amt: 250,
    will_liq_price: 2500,
    timestamp: Math.floor(Date.now() / 1000)
  });
  
  const input3 = circuit.generateUpdateNoteInput(note2, note3, {
    liq_price: Array(10).fill(1),
    liq_timestamp: Array(10).fill(0),
    lend_token_in: 0,
    lend_token_out: 0,
    borrow_token_in: 0,
    borrow_token_out: 250
  });
  
  circuit.saveInput(input3, 'test_repay.json');
  await circuit.generateWitness('test_repay.json', 'test_repay.wtns');
  
  execSync(
    `snarkjs groth16 prove ../../build/zringotts.zkey test_repay.wtns test_repay_proof.json test_repay_public.json`,
    { cwd: path.join(__dirname) }
  );
  
  const proof3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_repay_proof.json')));
  const public3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_repay_public.json')));
  
  proofs.repay = {
    proof: proof3,
    publicSignals: public3,
    inputs: input3
  };
  
  circuit.tree.insert(note3.hash);
  
  // ============================================
  // 4. Withdraw (Alice withdraws 500 WETH)
  // ============================================
  console.log('📝 Generating Proof 4: Withdraw');
  
  const note4 = circuit.createNote({
    lend_amt: 500,
    borrow_amt: 250,
    will_liq_price: 2500,
    timestamp: Math.floor(Date.now() / 1000)
  });
  
  const input4 = circuit.generateUpdateNoteInput(note3, note4, {
    liq_price: Array(10).fill(1),
    liq_timestamp: Array(10).fill(0),
    lend_token_in: 0,
    lend_token_out: 500,
    borrow_token_in: 0,
    borrow_token_out: 0
  });
  
  circuit.saveInput(input4, 'test_withdraw.json');
  await circuit.generateWitness('test_withdraw.json', 'test_withdraw.wtns');
  
  execSync(
    `snarkjs groth16 prove ../../build/zringotts.zkey test_withdraw.wtns test_withdraw_proof.json test_withdraw_public.json`,
    { cwd: path.join(__dirname) }
  );
  
  const proof4 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_withdraw_proof.json')));
  const public4 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_withdraw_public.json')));
  
  proofs.withdraw = {
    proof: proof4,
    publicSignals: public4,
    inputs: input4
  };
  
  // ============================================
  // Save all proofs in Solidity-compatible format
  // ============================================
  
  const solidityProofs = {};
  
  for (const [key, data] of Object.entries(proofs)) {
    solidityProofs[key] = {
      pA: [data.proof.pi_a[0], data.proof.pi_a[1]],
      pB: [
        [data.proof.pi_b[0][1], data.proof.pi_b[0][0]],
        [data.proof.pi_b[1][1], data.proof.pi_b[1][0]]
      ],
      pC: [data.proof.pi_c[0], data.proof.pi_c[1]],
      pubSignals: data.publicSignals,
      inputs: {
        noteHash: data.publicSignals[0],
        willLiqPrice: data.publicSignals[1],
        timestamp: data.publicSignals[2],
        nullifier: data.publicSignals[3],
        root: data.publicSignals[4],
        lendTokenOut: data.publicSignals[25],
        borrowTokenOut: data.publicSignals[26],
        lendTokenIn: data.publicSignals[27],
        borrowTokenIn: data.publicSignals[28]
      }
    };
  }
  
  fs.writeFileSync(
    path.join(__dirname, 'test_proofs.json'),
    JSON.stringify(solidityProofs, null, 2)
  );
  
  console.log('\n✅ All proofs generated successfully!');
  console.log('📄 Saved to: test/test_proofs.json\n');
  
  // Clean up intermediate files
  const filesToClean = [
    'test_deposit_initial.json',
    'test_deposit_initial.wtns',
    'test_deposit_initial_proof.json',
    'test_deposit_initial_public.json',
    'test_borrow.json',
    'test_borrow.wtns',
    'test_borrow_proof.json',
    'test_borrow_public.json',
    'test_repay.json',
    'test_repay.wtns',
    'test_repay_proof.json',
    'test_repay_public.json',
    'test_withdraw.json',
    'test_withdraw.wtns',
    'test_withdraw_proof.json',
    'test_withdraw_public.json'
  ];
  
  filesToClean.forEach(file => {
    const filepath = path.join(__dirname, file);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  });
  
  console.log('🧹 Cleaned up intermediate files\n');
  
  // Print summary
  console.log('📊 Proof Summary:');
  console.log('================');
  for (const [key, data] of Object.entries(solidityProofs)) {
    console.log(`\n${key}:`);
    console.log(`  Note Hash: ${data.inputs.noteHash}`);
    console.log(`  Nullifier: ${data.inputs.nullifier}`);
    console.log(`  Root: ${data.inputs.root}`);
    console.log(`  Lend In/Out: ${data.inputs.lendTokenIn}/${data.inputs.lendTokenOut}`);
    console.log(`  Borrow In/Out: ${data.inputs.borrowTokenIn}/${data.inputs.borrowTokenOut}`);
  }
  
  console.log('\n💡 Next steps:');
  console.log('============');
  console.log('1. Copy proof data from test_proofs.json');
  console.log('2. Use in Foundry tests: forge test -vv');
  console.log('3. Update test file with real proof values\n');
}

// Run the generator
generateTestProofs().catch(console.error);
