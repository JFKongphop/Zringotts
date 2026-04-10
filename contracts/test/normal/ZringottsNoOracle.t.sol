// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {Zringotts, IVerifier} from "../../src/Zringotts.sol";
import {MockToken} from "../../src/MockToken.sol";
import {Groth16Verifier} from "../../src/Groth16Verifier.sol";

contract ZringottsNoOracleTest is Test {
  Zringotts public lending;
  MockToken public weth;
  MockToken public usdc;
  Groth16Verifier public verifier;

  address public alice = address(0x1);
  address public bob = address(0x2);

  uint32 constant MERKLE_TREE_HEIGHT = 2;
  uint256 constant INITIAL_BALANCE = 1_000_000 * 10 ** 18;

  function setUp() public {
    // Deploy contracts
    verifier = new Groth16Verifier();
    weth = new MockToken("Wrapped Ether", "WETH", 18, 0);
    usdc = new MockToken("USD Coin", "USDC", 6, 0);
    lending = new Zringotts(IVerifier(address(verifier)), MERKLE_TREE_HEIGHT, weth, usdc);

    // Mint tokens to users
    weth.mint(alice, INITIAL_BALANCE);
    usdc.mint(alice, INITIAL_BALANCE);
    weth.mint(bob, INITIAL_BALANCE);
    usdc.mint(bob, INITIAL_BALANCE);

    // Mint tokens to contract for testing withdrawals
    weth.mint(address(lending), INITIAL_BALANCE);
    usdc.mint(address(lending), INITIAL_BALANCE);

    // Labels for better trace output
    vm.label(address(lending), "Zringotts");
    vm.label(address(weth), "WETH");
    vm.label(address(usdc), "USDC");
    vm.label(alice, "Alice");
    vm.label(bob, "Bob");
  }

  // ============================================
  // Test Contract Initialization
  // ============================================

  function test_ContractInitialization() public {
    assertEq(address(lending.verifier()), address(verifier));
    assertEq(address(lending.weth()), address(weth));
    assertEq(address(lending.usdc()), address(usdc));
    assertEq(lending.LIQUIDATED_ARRAY_NUMBER(), 10);
  }

  function test_LiquidatedArrayInitialization() public {
    for (uint256 i = 0; i < 10; i++) {
      (uint256 liq_price, uint256 timestamp) = lending.liquidated_array(i);
      assertEq(liq_price, i + 1);
      assertEq(timestamp, 0);
    }
  }

  // ============================================
  // Test Liquidated Array Management
  // ============================================

  function test_UpdateLiquidatedArray() public {
    uint8 index = 5;
    uint256 newPrice = 2000;
    uint256 newTimestamp = block.timestamp;

    lending.update_liquidated_array(index, newPrice, newTimestamp);

    (uint256 liq_price, uint256 timestamp) = lending.liquidated_array(index);
    assertEq(liq_price, newPrice);
    assertEq(timestamp, newTimestamp);
  }

  function test_RevertWhen_UpdateLiquidatedArrayOutOfBounds() public {
    vm.expectRevert("Index exceeds number of possible liquidated position buckets");
    lending.update_liquidated_array(10, 2000, block.timestamp);
  }

  function test_FlattenLiquidatedArray() public {
    uint256[] memory flattened = lending.flatten_liquidated_array();
    assertEq(flattened.length, 20);

    for (uint256 i = 0; i < 10; i++) {
      (uint256 liq_price, uint256 timestamp) = lending.liquidated_array(i);
      assertEq(flattened[2 * i], liq_price);
      assertEq(flattened[2 * i + 1], timestamp);
    }
  }

  // ============================================
  // Test Public Input Construction
  // ============================================

  function test_ConstructPublicInputs() public {
    bytes32 noteHash = bytes32(uint256(123));
    bytes32 root = bytes32(uint256(456));

    uint256[26] memory inputs = lending.constructPublicInputs(
      noteHash,
      root,
      100, // lend_token_out
      200, // borrow_token_out
      300, // lend_token_in
      400 // borrow_token_in
    );

    assertEq(inputs[0], uint256(noteHash));
    assertEq(inputs[1], uint256(root));
    assertEq(inputs[22], 100);
    assertEq(inputs[23], 200);
    assertEq(inputs[24], 300);
    assertEq(inputs[25], 400);
  }

  // ============================================
  // Test Token Validation
  // ============================================

  function test_RevertWhen_InvalidToken() public {
    MockToken invalidToken = new MockToken("Invalid", "INV", 18, 0);

    vm.expectRevert("Token must be weth or usdc");
    vm.prank(alice);
    lending.deposit(
      bytes32(0),
      bytes32(0),
      block.timestamp,
      bytes32(0),
      bytes32(0),
      [uint256(0), uint256(0)],
      [[uint256(0), uint256(0)], [uint256(0), uint256(0)]],
      [uint256(0), uint256(0)],
      100,
      invalidToken
    );
  }

  // ============================================
  // Test Timestamp Validation
  // ============================================

  function test_RevertWhen_TimestampTooOld() public {
    vm.startPrank(alice);
    weth.approve(address(lending), 100);

    // Advance time first, then use old timestamp
    vm.warp(block.timestamp + 10 minutes);
    uint256 oldTimestamp = block.timestamp - 6 minutes;

    vm.expectRevert("Invalid timestamp, must be within 5 minutes of proof generation");
    lending.deposit(
      bytes32(0),
      bytes32(0),
      oldTimestamp,
      bytes32(0),
      bytes32(0),
      [uint256(0), uint256(0)],
      [[uint256(0), uint256(0)], [uint256(0), uint256(0)]],
      [uint256(0), uint256(0)],
      100,
      weth
    );
    vm.stopPrank();
  }

  function test_RevertWhen_TimestampInFuture() public {
    // Set block timestamp to a reasonable value (10 minutes from start)
    vm.warp(10 minutes);

    vm.startPrank(alice);
    weth.approve(address(lending), 100);

    // Set a timestamp 1 second in the future
    uint256 futureTimestamp = block.timestamp + 1;

    vm.expectRevert("Invalid timestamp, must be in the past");
    lending.deposit(
      bytes32(0),
      bytes32(0),
      futureTimestamp,
      bytes32(0),
      bytes32(0),
      [uint256(0), uint256(0)],
      [[uint256(0), uint256(0)], [uint256(0), uint256(0)]],
      [uint256(0), uint256(0)],
      100,
      weth
    );
    vm.stopPrank();
  }

  // ============================================
  // Test Nullifier Double-Spend Protection
  // ============================================

  function test_NullifierTracking() public {
    bytes32 nullifier = bytes32(uint256(12_345));
    assertEq(lending.nullifierHashes(nullifier), false);
  }

  // ============================================
  // Test Commitment Tracking
  // ============================================

  function test_CommitmentTracking() public {
    bytes32 commitment = bytes32(uint256(67_890));
    assertEq(lending.commitments(commitment), false);
  }

  // ============================================
  // Test State Tracking
  // ============================================

  function test_StateInitialization() public {
    (int256 weth_deposit, int256 weth_borrow, int256 usdc_deposit, int256 usdc_borrow) = lending.state();

    assertEq(weth_deposit, 0);
    assertEq(weth_borrow, 0);
    assertEq(usdc_deposit, 0);
    assertEq(usdc_borrow, 0);
  }

  // ============================================
  // Integration Tests (Require Real Proofs)
  // ============================================

  function test_Deposit_WithRealProof() public {
    // TODO: Generate real proof using circuits/quickstart/
    // This is a placeholder showing the structure

    vm.startPrank(alice);

    uint256 depositAmount = 1000;
    weth.approve(address(lending), depositAmount);

    // These would come from actual proof generation
    bytes32 newNoteHash = bytes32(uint256(1));
    bytes32 willLiqPrice = bytes32(uint256(2500));
    uint256 timestamp = block.timestamp;
    bytes32 root = bytes32(uint256(0)); // Initial deposit
    bytes32 nullifier = bytes32(uint256(0)); // Initial deposit

    uint256[2] memory pA = [uint256(0), uint256(0)];
    uint256[2][2] memory pB = [[uint256(0), uint256(0)], [uint256(0), uint256(0)]];
    uint256[2] memory pC = [uint256(0), uint256(0)];

    // This will fail without real proof
    vm.expectRevert();
    lending.deposit(newNoteHash, willLiqPrice, timestamp, root, nullifier, pA, pB, pC, depositAmount, weth);

    vm.stopPrank();
  }

  // ============================================
  // Helper Functions for Testing
  // ============================================

  function test_TokenTransfer() public {
    uint256 amount = 100;

    vm.startPrank(alice);
    weth.approve(address(lending), amount);
    weth.transfer(address(lending), amount);
    vm.stopPrank();

    assertEq(weth.balanceOf(address(lending)), INITIAL_BALANCE + amount);
  }
}
