// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ConnectOracle, IConnectOracle} from "../src/ConnectOracle.sol";

contract ConnectOracleTest is Test {
  ConnectOracle public oracle;

  // Stub that returns a fixed price so tests run without a live precompile
  MockOracle public mockOracle;

  function setUp() public {
    mockOracle = new MockOracle();
    oracle = new ConnectOracle(address(mockOracle));
  }

  function test_GetPrice() public {
    (uint256 price, uint256 timestamp) = oracle.oracle_get_price();
    assertEq(price, 50_000e8, "BTC price mismatch");
    assertGt(timestamp, 0, "Timestamp should be non-zero");
  }

  function test_GetPrices() public {
    uint256[] memory prices = oracle.oracle_get_prices();
    assertEq(prices.length, 2, "Should return 2 prices");
    assertEq(prices[0], 50_000e8, "BTC price mismatch");
    assertEq(prices[1], 3000e8, "ETH price mismatch");
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Minimal stub that mimics the on-chain ConnectOracle precompile
// ──────────────────────────────────────────────────────────────────────────────
contract MockOracle {
  function get_price(string memory pair_id) external view returns (IConnectOracle.Price memory) {
    uint256 price;
    if (keccak256(bytes(pair_id)) == keccak256(bytes("BTC/USD"))) {
      price = 50_000e8;
    } else if (keccak256(bytes(pair_id)) == keccak256(bytes("ETH/USD"))) {
      price = 3000e8;
    }
    return IConnectOracle.Price({
      price: price,
      timestamp: block.timestamp,
      height: uint64(block.number),
      nonce: 1,
      decimal: 8,
      id: 1
    });
  }

  function get_prices(string[] memory pair_ids) external view returns (IConnectOracle.Price[] memory) {
    IConnectOracle.Price[] memory result = new IConnectOracle.Price[](pair_ids.length);
    for (uint256 i = 0; i < pair_ids.length; i++) {
      result[i] = this.get_price(pair_ids[i]);
    }
    return result;
  }
}
