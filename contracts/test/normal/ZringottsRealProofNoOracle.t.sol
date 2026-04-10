// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {Zringotts, IVerifier} from "../../src/Zringotts.sol";
import {MockToken} from "../../src/MockToken.sol";
import {Groth16Verifier} from "../../src/Groth16Verifier.sol";

/**
 * @title ZringottsRealProofNoOracleTest
 * @notice Integration tests with REAL ZK proofs generated via FFI — no oracle version
 * @dev This tests the complete flow with actual cryptographic proofs
 */
contract ZringottsRealProofNoOracleTest is Test {
  Zringotts public lending;
  MockToken public weth;
  MockToken public usdc;
  Groth16Verifier public verifier;

  address public alice = address(0x1);

  uint32 constant MERKLE_TREE_HEIGHT = 2;
  uint256 constant INITIAL_BALANCE = 1_000_000 * 10 ** 18;

  string merkleHelper = "test/helpers/generate-merkle-data.js";
  string proofHelper = "test/helpers/generate-proof.js";

  struct ProofData {
    uint256[2] pA;
    uint256[2][2] pB;
    uint256[2] pC;
    uint256[26] publicSignals;
  }

  function setUp() public {
    // Deploy contracts
    verifier = new Groth16Verifier();
    weth = new MockToken("Wrapped Ether", "WETH", 18, 0);
    usdc = new MockToken("USD Coin", "USDC", 6, 0);
    lending = new Zringotts(IVerifier(address(verifier)), MERKLE_TREE_HEIGHT, weth, usdc);

    // Mint tokens
    weth.mint(alice, INITIAL_BALANCE);
    usdc.mint(alice, INITIAL_BALANCE);
    weth.mint(address(lending), INITIAL_BALANCE);
    usdc.mint(address(lending), INITIAL_BALANCE);

    vm.label(address(lending), "Zringotts");
    vm.label(address(weth), "WETH");
    vm.label(alice, "Alice");
  }

  // ============================================
  // Helper Functions
  // ============================================

  function generateInitialDepositProof(
    uint256 lend_amt,
    uint256 will_liq_price,
    uint256 timestamp,
    uint256 nullifier,
    uint256 nonce
  )
    internal
    returns (ProofData memory)
  {
    string[] memory inputs = new string[](8);
    inputs[0] = "node";
    inputs[1] = proofHelper;
    inputs[2] = "deposit-initial";
    inputs[3] = vm.toString(lend_amt);
    inputs[4] = vm.toString(will_liq_price);
    inputs[5] = vm.toString(timestamp);
    inputs[6] = vm.toString(nullifier);
    inputs[7] = vm.toString(nonce);

    bytes memory result = vm.ffi(inputs);
    return abi.decode(result, (ProofData));
  }

  function hashNote(
    uint256 lend_amt,
    uint256 borrow_amt,
    uint256 will_liq_price,
    uint256 timestamp,
    uint256 nullifier,
    uint256 nonce
  )
    internal
    returns (bytes32)
  {
    string[] memory inputs = new string[](9);
    inputs[0] = "node";
    inputs[1] = merkleHelper;
    inputs[2] = "hash-note";
    inputs[3] = vm.toString(lend_amt);
    inputs[4] = vm.toString(borrow_amt);
    inputs[5] = vm.toString(will_liq_price);
    inputs[6] = vm.toString(timestamp);
    inputs[7] = vm.toString(nullifier);
    inputs[8] = vm.toString(nonce);

    bytes memory result = vm.ffi(inputs);
    return bytes32(abi.decode(result, (uint256)));
  }

  // ============================================
  // Real Proof Tests
  // ============================================

  function test_RealProof_InitialDeposit() public {
    console.log("\n=== REAL PROOF: Initial Deposit ===\n");

    uint256 depositAmount = 1000;
    uint256 will_liq_price = 2500;
    uint256 timestamp = block.timestamp;
    uint256 nullifier = 111_111;
    uint256 nonce = 999_999;

    // Generate REAL proof via FFI
    console.log("Generating real ZK proof...");
    ProofData memory proofData = generateInitialDepositProof(depositAmount, will_liq_price, timestamp, nullifier, nonce);

    console.log("Proof generated!");
    console.log("Public signals count:", proofData.publicSignals.length);
    console.log("Note hash:", proofData.publicSignals[0]);
    console.log("Will liq price:", proofData.publicSignals[1]);
    console.log("Timestamp:", proofData.publicSignals[2]);

    // Verify proof matches expected values
    assertGt(proofData.publicSignals[0], 0, "Note hash should not be zero");
    assertEq(proofData.publicSignals[24], depositAmount, "Lend token in mismatch");

    // Advance time so timestamp check doesn't underflow
    vm.warp(block.timestamp + 1 hours);
    uint256 currentTime = block.timestamp;

    // Prepare transaction
    vm.startPrank(alice);
    weth.approve(address(lending), depositAmount);

    // Call contract with REAL proof
    console.log("\nSubmitting transaction with real proof...");
    lending.deposit(
      bytes32(proofData.publicSignals[0]), // new_note_hash
      bytes32(0), // new_will_liq_price
      currentTime, // new_timestamp (within 5 min window)
      bytes32(proofData.publicSignals[1]), // root
      bytes32(0), // old_nullifier (initial deposit)
      proofData.pA,
      proofData.pB,
      proofData.pC,
      depositAmount,
      weth
    );
    vm.stopPrank();

    console.log("Transaction succeeded with REAL proof verification!");

    // Verify state changes
    (int256 weth_deposit,,,) = lending.state();
    assertEq(weth_deposit, int256(depositAmount), "WETH deposit not tracked");

    // Verify commitment was added
    assertTrue(lending.commitments(bytes32(proofData.publicSignals[0])), "Commitment not added");

    console.log("All assertions passed!\n");
  }

  function test_RealProof_VerifierDirectCall() public {
    console.log("\n=== REAL PROOF: Direct Verifier Test ===\n");

    uint256 depositAmount = 1000;
    uint256 will_liq_price = 2500;
    uint256 timestamp = block.timestamp;
    uint256 nullifier = 222_222;
    uint256 nonce = 888_888;

    // Generate proof
    console.log("Generating proof...");
    ProofData memory proofData = generateInitialDepositProof(depositAmount, will_liq_price, timestamp, nullifier, nonce);

    // Call verifier directly
    console.log("Calling verifier directly...");
    bool isValid = verifier.verifyProof(proofData.pA, proofData.pB, proofData.pC, proofData.publicSignals);

    assertTrue(isValid, "Proof verification failed");
    console.log("Proof verified successfully by verifier contract!\n");
  }

  function test_RealProof_InvalidProofShouldFail() public {
    console.log("\n=== REAL PROOF: Invalid Proof Test ===\n");

    uint256 depositAmount = 1000;
    uint256 will_liq_price = 2500;
    uint256 timestamp = block.timestamp;

    // Generate a valid proof
    ProofData memory proofData = generateInitialDepositProof(depositAmount, will_liq_price, timestamp, 333_333, 777_777);

    // Tamper with proof (change pA)
    proofData.pA[0] = proofData.pA[0] + 1;

    // Try to verify tampered proof
    bool isValid = verifier.verifyProof(proofData.pA, proofData.pB, proofData.pC, proofData.publicSignals);

    assertFalse(isValid, "Tampered proof should fail verification");
    console.log("Tampered proof correctly rejected!\n");
  }

  function test_RealProof_WrongPublicInputsShouldFail() public {
    console.log("\n=== REAL PROOF: Wrong Public Inputs Test ===\n");

    uint256 depositAmount = 1000;
    uint256 will_liq_price = 2500;
    uint256 timestamp = block.timestamp;

    // Generate a valid proof
    ProofData memory proofData = generateInitialDepositProof(depositAmount, will_liq_price, timestamp, 444_444, 666_666);

    // Tamper with public signals
    proofData.publicSignals[0] = proofData.publicSignals[0] + 1;

    // Try to verify with wrong public inputs
    bool isValid = verifier.verifyProof(proofData.pA, proofData.pB, proofData.pC, proofData.publicSignals);

    assertFalse(isValid, "Proof with wrong public inputs should fail");
    console.log("Wrong public inputs correctly rejected!\n");
  }

  function test_RealProof_ContractRejectsInvalidProof() public {
    console.log("\n=== REAL PROOF: Contract Rejection Test ===\n");

    uint256 depositAmount = 1000;
    uint256 will_liq_price = 2500;
    uint256 timestamp = block.timestamp;

    // Generate valid proof
    ProofData memory proofData = generateInitialDepositProof(depositAmount, will_liq_price, timestamp, 555_555, 444_444);

    // Tamper with proof (flip last bit of pC to avoid overflow)
    proofData.pC[0] = proofData.pC[0] ^ 1;

    vm.warp(block.timestamp + 1 hours);

    // Try to deposit with invalid proof - expect any revert (verifier or timestamp)
    vm.startPrank(alice);
    weth.approve(address(lending), depositAmount);

    vm.expectRevert();
    lending.deposit(
      bytes32(proofData.publicSignals[0]),
      bytes32(0),
      block.timestamp,
      bytes32(proofData.publicSignals[1]),
      bytes32(0),
      proofData.pA,
      proofData.pB,
      proofData.pC,
      depositAmount,
      weth
    );
    vm.stopPrank();

    console.log("Contract correctly rejected invalid proof!\n");
  }

  // ============================================
  // Full Real Flow Test
  // ============================================

  /**
   * @notice Full lending lifecycle with real ZK proofs:
   *   Step 1 – Initial deposit (500 WETH)
   *   Step 2 – Add collateral (+500 WETH, total 1000)
   *   Step 3 – Borrow 500 USDC
   *   Step 4 – Repay 500 USDC
   *
   * All proofs are generated in one FFI call so the JS side can build
   * the contract's Merkle tree incrementally and produce the correct
   * roots / inclusion paths for each step.
   */
  function test_RealProof_FullFlow() public {
    console.log("\n=== REAL PROOF: Full Lending Flow ===\n");

    // Use a realistic timestamp so the contract's 5-min freshness window passes
    vm.warp(1_704_067_200); // 2024-01-01 00:00:00 UTC
    uint256 ts = block.timestamp;

    // Generate all 4 proofs with a single FFI call
    string[] memory inputs = new string[](4);
    inputs[0] = "node";
    inputs[1] = proofHelper;
    inputs[2] = "full-flow";
    inputs[3] = vm.toString(ts);

    bytes memory result = vm.ffi(inputs);

    (ProofData memory p1, ProofData memory p2, ProofData memory p3, ProofData memory p4) =
      abi.decode(result, (ProofData, ProofData, ProofData, ProofData));

    console.log("All 4 proofs generated successfully");

    // ── Step 1: Initial deposit 500 WETH ────────────────────────────
    vm.startPrank(alice);
    weth.approve(address(lending), 1000); // covers steps 1 + 2
    lending.deposit(
      bytes32(p1.publicSignals[0]), // new_note_hash
      bytes32(0), // new_will_liq_price (not oracle-checked)
      ts,
      bytes32(p1.publicSignals[1]), // root
      bytes32(0), // old_nullifier = 0 → initial deposit
      p1.pA,
      p1.pB,
      p1.pC,
      500,
      weth
    );
    vm.stopPrank();

    {
      (int256 wethDeposit,,,) = lending.state();
      assertEq(wethDeposit, 500, "Step 1: weth_deposit_amount should be 500");
      assertTrue(lending.commitments(bytes32(p1.publicSignals[0])), "Step 1: note1 not committed");
    }
    console.log("Step 1 (deposit 500 WETH) passed");

    // ── Step 2: Add collateral +500 WETH, spend note1 ───────────────
    vm.startPrank(alice);
    lending.deposit(
      bytes32(p2.publicSignals[0]),
      bytes32(0),
      ts,
      bytes32(p2.publicSignals[1]), // root after step 1
      bytes32(uint256(112)), // old_nullifier = note1.nullifier
      p2.pA,
      p2.pB,
      p2.pC,
      500,
      weth
    );
    vm.stopPrank();

    {
      (int256 wethDeposit,,,) = lending.state();
      assertEq(wethDeposit, 1000, "Step 2: weth_deposit_amount should be 1000");
      assertTrue(lending.commitments(bytes32(p2.publicSignals[0])), "Step 2: note2 not committed");
      assertTrue(lending.nullifierHashes(bytes32(uint256(112))), "Step 2: note1 nullifier not marked spent");
    }
    console.log("Step 2 (add collateral +500 WETH) passed");

    // ── Step 3: Borrow 500 USDC, spend note2 ────────────────────────
    vm.startPrank(alice);
    lending.borrow(
      bytes32(p3.publicSignals[0]),
      bytes32(0),
      ts,
      bytes32(p3.publicSignals[1]), // root after step 2
      bytes32(uint256(999)), // old_nullifier = note2.nullifier
      p3.pA,
      p3.pB,
      p3.pC,
      500,
      usdc,
      alice
    );
    vm.stopPrank();

    {
      (,,, int256 usdcBorrow) = lending.state();
      assertEq(usdcBorrow, 500, "Step 3: usdc_borrow_amount should be 500");
      assertTrue(lending.commitments(bytes32(p3.publicSignals[0])), "Step 3: note3 not committed");
      assertTrue(lending.nullifierHashes(bytes32(uint256(999))), "Step 3: note2 nullifier not marked spent");
    }
    console.log("Step 3 (borrow 500 USDC) passed");

    // ── Step 4: Repay 500 USDC, spend note3 ─────────────────────────
    vm.startPrank(alice);
    usdc.approve(address(lending), 500);
    lending.repay(
      bytes32(p4.publicSignals[0]),
      bytes32(0),
      ts,
      bytes32(p4.publicSignals[1]), // root after step 3
      bytes32(uint256(1111)), // old_nullifier = note3.nullifier
      p4.pA,
      p4.pB,
      p4.pC,
      500,
      usdc
    );
    vm.stopPrank();

    {
      (,,, int256 usdcBorrow) = lending.state();
      assertEq(usdcBorrow, 0, "Step 4: usdc_borrow_amount should be 0 after repay");
      assertTrue(lending.commitments(bytes32(p4.publicSignals[0])), "Step 4: note4 not committed");
      assertTrue(lending.nullifierHashes(bytes32(uint256(1111))), "Step 4: note3 nullifier not marked spent");
    }
    console.log("Step 4 (repay 500 USDC) passed");

    // Final state: 1000 WETH deposited, 0 USDC borrowed
    (int256 finalWethDeposit, int256 finalWethBorrow, int256 finalUsdcDeposit, int256 finalUsdcBorrow) = lending.state();
    assertEq(finalWethDeposit, 1000, "Final: weth_deposit should be 1000");
    assertEq(finalWethBorrow, 0, "Final: weth_borrow should be 0");
    assertEq(finalUsdcDeposit, 0, "Final: usdc_deposit should be 0");
    assertEq(finalUsdcBorrow, 0, "Final: usdc_borrow should be 0");

    console.log("\nFull flow completed: Deposit -> Add Collateral -> Borrow -> Repay\n");
  }
}
