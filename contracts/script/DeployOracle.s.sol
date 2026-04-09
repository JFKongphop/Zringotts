// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {ZringottsOracle, IVerifier, IConnectOracle} from "../src/ZringottsOracle.sol";
import {MockToken} from "../src/MockToken.sol";
import {Groth16Verifier} from "../src/Groth16Verifier.sol";

/**
 * @title Deploy
 * @notice Deploys the full Zringotts ZK lending protocol
 *
 * Usage:
 *   # Local anvil
 *   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
 *
 *   # Testnet (e.g. Sepolia) — set PRIVATE_KEY in .env
 *   forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
 */
contract Deploy is Script {
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

    // Connect Oracle precompile address on Initia MiniEVM
    // Query: curl ${REST_URL}/minievm/evm/v1/connect_oracle
    address connectOracleAddress = 0x031ECb63480983FD216D17BB6e1d393f3816b72F;

    // 4. Deploy main lending contract
    ZringottsOracle lending = new ZringottsOracle(
      IVerifier(address(verifier)),
      MERKLE_TREE_HEIGHT,
      weth,
      usdc,
      IConnectOracle(connectOracleAddress),
      "ETH/USD",
      "USDC/USD"
    );

    // 4. Fund the lending contract with demo liquidity
    weth.transfer(address(lending), INITIAL_SUPPLY / 2);
    usdc.transfer(address(lending), INITIAL_SUPPLY / 2);

    vm.stopBroadcast();

    console.log("=== Zringotts Deployment ===");
    console.log("Deployer  :", deployer);
    console.log("WETH      :", address(weth));
    console.log("USDC      :", address(usdc));
    console.log("Verifier  :", address(verifier));
    console.log("ZringottsOracle:", address(lending));
    console.log("Tree height:", MERKLE_TREE_HEIGHT);
  }
}
