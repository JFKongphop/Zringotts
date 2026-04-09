// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {Zringotts, IVerifier} from "../src/Zringotts.sol";
import {MockToken} from "../src/MockToken.sol";
import {Groth16Verifier} from "../src/Groth16Verifier.sol";

/**
 * @title DeployNoOracle
 * @notice Deploys Zringotts without a price oracle (no liq_price validation)
 *
 * Usage:
 *   # Local anvil
 *   forge script script/DeployNoOracle.s.sol --rpc-url http://localhost:8545 --broadcast
 *
 *   # Any EVM testnet — set PRIVATE_KEY and RPC_URL in .env
 *   forge script script/DeployNoOracle.s.sol --rpc-url $RPC_URL --broadcast --verify
 */
contract DeployNoOracle is Script {
  // MUST match the circuit: `component main = Main(2)` in zringotts.circom
  // Height 2 => 4 max active notes. Recompile circuit + new zkey to increase.
  uint32 constant MERKLE_TREE_HEIGHT = 2;

  // Initial token supply minted to the deployer (for demo liquidity)
  uint256 constant INITIAL_SUPPLY = 1_000_000 * 1e18;

  function run() external {
    uint256 deployerKey = vm.envUint("PRIVATE_KEY");
    address deployer = vm.addr(deployerKey);

    vm.startBroadcast(deployerKey);

    // 1. Deploy mock tokens
    MockToken weth = new MockToken("Wrapped Ether", "WETH", 18, INITIAL_SUPPLY);
    MockToken usdc = new MockToken("USD Coin", "USDC", 6, INITIAL_SUPPLY);

    // 2. Deploy Groth16 verifier (generated from circuit)
    Groth16Verifier verifier = new Groth16Verifier();

    // 3. Deploy main lending contract (no oracle)
    Zringotts lending = new Zringotts(IVerifier(address(verifier)), MERKLE_TREE_HEIGHT, weth, usdc);

    // 4. Fund the lending contract with demo liquidity
    weth.transfer(address(lending), INITIAL_SUPPLY / 2);
    usdc.transfer(address(lending), INITIAL_SUPPLY / 2);

    vm.stopBroadcast();

    console.log("=== Zringotts Deployment (No Oracle) ===");
    console.log("Deployer  :", deployer);
    console.log("WETH      :", address(weth));
    console.log("USDC      :", address(usdc));
    console.log("Verifier  :", address(verifier));
    console.log("Zringotts :", address(lending));
    console.log("Tree height:", MERKLE_TREE_HEIGHT);
  }
}
