// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ConnectOracle} from "../src/ConnectOracle.sol";

contract DeployConnectOracle is Script {
  // Initia MiniEVM precompile address (same on all Initia chains)
  address constant CONNECT_ORACLE_PRECOMPILE = 0x031ECb63480983FD216D17BB6e1d393f3816b72F;

  function run() public {
    vm.startBroadcast();
    ConnectOracle oracle = new ConnectOracle(CONNECT_ORACLE_PRECOMPILE);
    vm.stopBroadcast();

    console.log("=== ConnectOracle Deployment ===");
    console.log("ConnectOracle  :", address(oracle));
    console.log("Oracle precompile:", CONNECT_ORACLE_PRECOMPILE);
  }
}
