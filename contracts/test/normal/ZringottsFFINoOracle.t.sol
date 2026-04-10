// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {Zringotts, IVerifier} from "../../src/Zringotts.sol";
import {MockToken} from "../../src/MockToken.sol";
import {Groth16Verifier} from "../../src/Groth16Verifier.sol";

/**
 * @title ZringottsFFINoOracleTest
 * @notice Tests using real Merkle tree data generated via FFI — no oracle version
 * @dev Requires ffi = true in foundry.toml
 */
contract ZringottsFFINoOracleTest is Test {
  Zringotts public lending;
  MockToken public weth;
  MockToken public usdc;
  Groth16Verifier public verifier;

  address public alice = address(0x1);
  address public bob = address(0x2);

  uint32 constant MERKLE_TREE_HEIGHT = 2;
  uint256 constant INITIAL_BALANCE = 1_000_000 * 10 ** 18;

  string basePath = "test/helpers/generate-merkle-data.js";

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
    vm.label(address(usdc), "USDC");
    vm.label(alice, "Alice");
    vm.label(bob, "Bob");
  }

  // ============================================
  // Helper Functions
  // ============================================

  function getEmptyRoot() internal returns (bytes32) {
    string[] memory inputs = new string[](3);
    inputs[0] = "node";
    inputs[1] = basePath;
    inputs[2] = "empty-root";

    bytes memory result = vm.ffi(inputs);
    return bytes32(abi.decode(result, (uint256)));
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
    inputs[1] = basePath;
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

  function insertAndGetRoot(bytes32 leaf) internal returns (bytes32) {
    string[] memory inputs = new string[](4);
    inputs[0] = "node";
    inputs[1] = basePath;
    inputs[2] = "insert-and-get-root";
    inputs[3] = vm.toString(uint256(leaf));

    bytes memory result = vm.ffi(inputs);
    return bytes32(abi.decode(result, (uint256)));
  }

  // ============================================
  // Test Real Merkle Tree Values
  // ============================================

  function test_FFI_EmptyRoot() public {
    bytes32 emptyRoot = getEmptyRoot();

    // Empty root should not be zero
    assertTrue(emptyRoot != bytes32(0), "Empty root should not be zero");

    console.log("Empty Merkle Root:");
    console.logBytes32(emptyRoot);
  }

  function test_FFI_HashNote() public {
    uint256 lend_amt = 1000;
    uint256 borrow_amt = 0;
    uint256 will_liq_price = 2500;
    uint256 timestamp = block.timestamp;
    uint256 nullifier = 12_345;
    uint256 nonce = 67_890;

    bytes32 noteHash = hashNote(lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce);

    // Hash should not be zero
    assertTrue(noteHash != bytes32(0), "Note hash should not be zero");

    console.log("Note Hash:");
    console.logBytes32(noteHash);
    console.log("Parameters:");
    console.log("  lend_amt:", lend_amt);
    console.log("  borrow_amt:", borrow_amt);
    console.log("  will_liq_price:", will_liq_price);
    console.log("  timestamp:", timestamp);
  }

  function test_FFI_HashConsistency() public {
    uint256 lend_amt = 1000;
    uint256 borrow_amt = 0;
    uint256 will_liq_price = 2500;
    uint256 timestamp = block.timestamp;
    uint256 nullifier = 12_345;
    uint256 nonce = 67_890;

    bytes32 hash1 = hashNote(lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce);
    bytes32 hash2 = hashNote(lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce);

    assertEq(hash1, hash2, "Same inputs should produce same hash");
  }

  function test_FFI_HashUniqueness() public {
    uint256 timestamp = block.timestamp;

    bytes32 hash1 = hashNote(1000, 0, 2500, timestamp, 12_345, 67_890);
    bytes32 hash2 = hashNote(1000, 500, 2500, timestamp, 12_345, 67_890);

    assertTrue(hash1 != hash2, "Different inputs should produce different hashes");
  }

  function test_FFI_InsertAndGetRoot() public {
    bytes32 noteHash = hashNote(1000, 0, 2500, block.timestamp, 12_345, 67_890);
    bytes32 rootAfterInsert = insertAndGetRoot(noteHash);

    assertTrue(rootAfterInsert != bytes32(0), "Root after insert should not be zero");

    console.log("Root after inserting note:");
    console.logBytes32(rootAfterInsert);
  }

  // ============================================
  // Test Contract Integration with Real Values
  // ============================================

  function test_FFI_ConstructPublicInputsWithRealHash() public {
    // Generate real note hash
    uint256 lend_amt = 1000;
    uint256 borrow_amt = 500;
    uint256 will_liq_price = 2500;
    uint256 timestamp = block.timestamp;
    uint256 nullifier = 12_345;
    uint256 nonce = 67_890;

    bytes32 noteHash = hashNote(lend_amt, borrow_amt, will_liq_price, timestamp, nullifier, nonce);
    bytes32 rootAfterInsert = insertAndGetRoot(noteHash);

    // Construct public inputs using real values
    uint256[26] memory inputs = lending.constructPublicInputs(
      noteHash, // new_note_hash (real)
      rootAfterInsert, // root (real)
      0, // lend_token_out
      0, // borrow_token_out
      lend_amt, // lend_token_in
      borrow_amt // borrow_token_in
    );

    // Verify the inputs are constructed correctly
    assertEq(inputs[0], uint256(noteHash), "Note hash mismatch");
    assertEq(inputs[1], uint256(rootAfterInsert), "Root mismatch");
    assertEq(inputs[24], lend_amt, "Lend token in mismatch");
    assertEq(inputs[25], borrow_amt, "Borrow token in mismatch");

    console.log("Public Inputs with Real Values:");
    console.log("  Note Hash:", uint256(inputs[0]));
    console.log("  Root:", uint256(inputs[1]));
    console.log("  Lend Token In:", inputs[24]);
    console.log("  Borrow Token In:", inputs[25]);
  }

  function test_FFI_MultipleNotesInTree() public {
    // Insert multiple notes and track roots
    bytes32 note1 = hashNote(1000, 0, 2500, block.timestamp, 11_111, 99_999);
    bytes32 note2 = hashNote(2000, 500, 2600, block.timestamp + 1, 22_222, 88_888);
    bytes32 note3 = hashNote(1500, 300, 2550, block.timestamp + 2, 33_333, 77_777);

    console.log("Note 1 (1000 lend, 0 borrow):");
    console.logBytes32(note1);

    console.log("Note 2 (2000 lend, 500 borrow):");
    console.logBytes32(note2);

    console.log("Note 3 (1500 lend, 300 borrow):");
    console.logBytes32(note3);

    // Each note should be unique
    assertTrue(note1 != note2, "Note 1 and 2 should be different");
    assertTrue(note2 != note3, "Note 2 and 3 should be different");
    assertTrue(note1 != note3, "Note 1 and 3 should be different");
  }

  function test_FFI_NullifierUniqueness() public {
    uint256 timestamp = block.timestamp;

    // Same note parameters but different nullifiers
    bytes32 hash1 = hashNote(1000, 0, 2500, timestamp, 11_111, 67_890);
    bytes32 hash2 = hashNote(1000, 0, 2500, timestamp, 22_222, 67_890);

    assertTrue(hash1 != hash2, "Different nullifiers should produce different hashes");

    console.log("Hash with nullifier 11111:");
    console.logBytes32(hash1);
    console.log("Hash with nullifier 22222:");
    console.logBytes32(hash2);
  }

  function test_FFI_NonceUniqueness() public {
    uint256 timestamp = block.timestamp;

    // Same note parameters but different nonces
    bytes32 hash1 = hashNote(1000, 0, 2500, timestamp, 12_345, 11_111);
    bytes32 hash2 = hashNote(1000, 0, 2500, timestamp, 12_345, 22_222);

    assertTrue(hash1 != hash2, "Different nonces should produce different hashes");

    console.log("Hash with nonce 11111:");
    console.logBytes32(hash1);
    console.log("Hash with nonce 22222:");
    console.logBytes32(hash2);
  }

  // ============================================
  // Test Realistic Scenarios
  // ============================================

  function test_FFI_DepositScenario() public {
    console.log("\n=== Deposit Scenario ===");

    // Alice deposits 1000 WETH
    uint256 depositAmount = 1000;
    uint256 timestamp = block.timestamp;

    // Generate note for deposit
    bytes32 depositNote = hashNote(
      depositAmount, // lend_amt
      0, // borrow_amt (no borrow yet)
      2500, // will_liq_price
      timestamp,
      111_111, // nullifier
      999_999 // nonce
    );

    console.log("Deposit Note Hash:");
    console.logBytes32(depositNote);

    // This note would be inserted into the tree
    bytes32 rootAfterDeposit = insertAndGetRoot(depositNote);

    console.log("Root after deposit:");
    console.logBytes32(rootAfterDeposit);

    // Construct public inputs for deposit
    uint256[26] memory inputs = lending.constructPublicInputs(
      depositNote,
      bytes32(0), // Empty root (first deposit)
      0, // lend_token_out
      0, // borrow_token_out
      depositAmount, // lend_token_in
      0 // borrow_token_in
    );

    console.log("Public inputs constructed for deposit");
    assertEq(inputs[24], depositAmount, "Lend token in should match deposit");
  }

  function test_FFI_BorrowScenario() public {
    console.log("\n=== Borrow Scenario ===");

    // Starting position: 1000 WETH deposited
    // Alice borrows 500 USDC

    uint256 timestamp1 = block.timestamp;
    uint256 timestamp2 = block.timestamp + 60;

    // Previous note (before borrow)
    bytes32 prevNote = hashNote(1000, 0, 2500, timestamp1, 111_111, 999_999);
    bytes32 rootBefore = insertAndGetRoot(prevNote);

    console.log("Previous Note (before borrow):");
    console.logBytes32(prevNote);
    console.log("Root before borrow:");
    console.logBytes32(rootBefore);

    // New note (after borrow)
    bytes32 newNote = hashNote(1000, 500, 2500, timestamp2, 222_222, 888_888);

    console.log("\nNew Note (after borrowing 500):");
    console.logBytes32(newNote);

    // Construct public inputs for borrow
    uint256[26] memory inputs = lending.constructPublicInputs(
      newNote,
      rootBefore,
      0, // lend_token_out
      0, // borrow_token_out
      0, // lend_token_in
      500 // borrow_token_in
    );

    console.log("Public inputs constructed for borrow");
    assertEq(inputs[25], 500, "Borrow token in should be 500");
  }
}
