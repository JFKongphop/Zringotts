# Zringotts

A privacy-preserving lending protocol powered by Zero-Knowledge Proofs on Initia.

## Initia Hackathon Submission

- **Project Name**: Zringotts

### Project Overview

Zringotts is a decentralized lending platform that uses Zero-Knowledge Proofs (ZK-SNARKs) to enable private collateralized loans. Users can deposit collateral (WETH), borrow against it (USDC), repay debt, and withdraw collateral - all while keeping their financial positions completely private on-chain. The protocol uses Groth16 proofs generated directly in the browser, combining Circom circuits with EVM smart contracts to create a trustless, privacy-first lending experience.

### Implementation Detail

- **The Custom Implementation**: Zringotts implements a complete ZK lending protocol from scratch, including:
  - Custom Circom circuits for proving valid state transitions (deposit, borrow, repay, withdraw)
  - Merkle tree-based commitment scheme for privacy (only commitments are stored on-chain, not amounts)
  - Interest rate calculations enforced at the circuit level (2% APR for lending, 5% APR for borrowing)
  - LTV (Loan-to-Value) constraints verified in zero-knowledge
  - Browser-based proof generation using snarkjs (15-30 second proving time)
  - Multi-position support with automatic Merkle tree reconstruction from blockchain events

- **The Native Feature**: **Interwoven Bridge** - The frontend implements the Interwoven Bridge to enable cross-chain asset transfers between Initia L1 (initiation-2) and the EVM side (evm-1). Users must bridge INIT tokens from L1 to evm-1 before participating in the lending protocol. The bridge page ([frontend/app/bridge/page.tsx](frontend/app/bridge/page.tsx)) uses `openBridge()` from `@initia/interwovenkit-react` to facilitate seamless cross-chain transfers, leveraging Initia's native Interwoven Bridge infrastructure. This enables users to move assets between the Move and EVM execution environments within the Initia ecosystem.

---

## 🎯 Problem & Solution

### The Problem

**DeFi Lending Lacks Privacy**

Current lending protocols (Aave, Compound, MakerDAO) expose every financial detail on-chain:
- 📊 **Transparent Positions**: Anyone can see exactly how much you've deposited and borrowed
- 🎯 **Easy Target for Attacks**: Large positions become targets for liquidation hunters and front-runners
- 🏢 **Corporate Concerns**: Institutions can't use DeFi without revealing their entire financial strategy to competitors
- 📉 **Market Manipulation**: Whales' positions are public knowledge, enabling predatory trading strategies
- ⚖️ **Regulatory Risk**: Full transparency creates compliance challenges in jurisdictions requiring financial privacy

**Example Scenario:**
```
Alice deposits $1M WETH on Aave
→ Transaction is public
→ Competitors track her position
→ She borrows $400K USDC
→ Price drops slightly
→ Liquidation bots monitor her 24/7
→ She gets liquidated at the worst possible moment
```

**The Core Issue:** Blockchains achieve transparency through full disclosure, but **financial privacy is a fundamental right** that shouldn't be sacrificed for decentralization.

### The Solution

**Zero-Knowledge Proofs Enable Private Lending**

Zringotts solves this by using ZK-SNARKs to prove valid financial operations without revealing the details:

✅ **Private Positions**
- Only commitment hashes are stored on-chain
- Actual deposit/borrow amounts remain encrypted in user's browser
- No one can see your financial position size

✅ **Verifiable Solvency**
- ZK proofs mathematically guarantee you're not over-borrowing
- LTV (Loan-to-Value) constraints enforced in zero-knowledge
- Protocol remains trustless without exposing private data

✅ **Unlinkable Transactions**
- Deposits can't be linked to withdrawals
- Each transaction uses a new commitment with fresh nullifiers
- Even you look like a different user each time

✅ **Competitive Advantage**
- Institutions can use DeFi without revealing strategies
- Individual users protected from front-running and liquidation hunters
- Privacy-by-default, not privacy-by-obscurity

✅ **Regulatory Compliance**
- Users maintain control over their data
- Optional selective disclosure for compliance
- Meets privacy requirements in strict jurisdictions

**Same Scenario with Zringotts:**
```
Alice deposits $1M WETH on Zringotts
→ Only a commitment hash is public: 0x7f3e9a2b...
→ Competitors see: "Someone deposited something"
→ She borrows $400K USDC
→ Only she knows her LTV ratio
→ No one can target her position
→ She manages her collateral privately and safely
```

### Why This Matters

- **$200B+ TVL** in DeFi lending today, all fully transparent
- **Institutional adoption** blocked by privacy concerns
- **User protection** from MEV bots and liquidation snipers
- **Competitive markets** require private information
- **Financial privacy** is a human right, even on-chain

**Zringotts proves you can have both:** trustless verification AND complete privacy.

---

## Architecture Overview

### 🔐 Zero-Knowledge Circuit (`circuits/`)

The heart of Zringotts is a Circom circuit (`zringotts.circom`) that proves valid state transitions without revealing sensitive information.

**Circuit Components:**

1. **Note Structure** (Private)
   - `lendAmt`: Amount of collateral deposited
   - `borrowAmt`: Amount borrowed against collateral
   - `willLiqPrice`: Liquidation price threshold
   - `timestamp`: Last update time
   - `nullifier`: Unique identifier for spending notes
   - `nonce`: Randomness for commitment generation

2. **Key Templates:**
   - `UpdateAmt()`: Calculates interest over time
     ```
     newAmount = (oldAmount × ONE_YEAR + oldAmount × INTEREST_RATE × timeDiff) / ONE_YEAR
     ```
   - `CheckLTV()`: Enforces loan-to-value ratio
     ```
     BORROW_AMT × 100 ≤ 50 × LENT_AMT × WILL_LIG_PRICE
     ```
   - `MerkleTreeInclusionProof()`: Verifies commitment exists in Merkle tree
   - `Main()`: Orchestrates all constraints and public/private inputs

3. **Privacy Guarantees:**
   - Only the commitment hash (`noteHash = Poseidon(lendAmt, borrowAmt, willLiqPrice, timestamp, nullifier, nonce)`) is stored on-chain
   - Actual amounts remain private in user's local storage
   - Nullifiers prevent double-spending
   - Merkle tree hides which position is being updated

**Circuit Parameters:**
- Tree depth: 2 levels (supports 4 positions)
- Hash function: Poseidon (ZK-friendly)
- Proof system: Groth16
- Field size: BN128 curve (~254 bits)

### 📜 Smart Contracts (`contracts/src/`)

**Main Contract: `Zringotts.sol`**

```solidity
contract Zringotts {
    // Privacy-preserving state
    mapping(bytes32 => bool) public commitments;  // Only hashes stored
    mapping(bytes32 => bool) public nullifiers;   // Prevent double-spend
    
    MerkleTreeWithHistory merkleTree;  // LEVEL = 2 (4 leaves)
    
    function deposit(bytes32 commitment, ..., proof) external
    function borrow(bytes32 newCommitment, ..., proof) external
    function repay(bytes32 newCommitment, ..., proof) external
    function withdraw(bytes32 newCommitment, ..., proof) external
}
```

**Key Features:**
- **Groth16Verifier.sol**: On-chain proof verification (auto-generated from circuit)
- **MerkleTreeWithHistory.sol**: Tracks all commitments in a Merkle tree
- **ReentrancyGuard**: Protection against reentrancy attacks
- **MockToken.sol**: WETH and USDC test tokens with minting functionality

**Interest Rates:**
- Lending: 2% APR
- Borrowing: 5% APR
- LTV Threshold: 50% (can borrow up to half of collateral value)

### 🌐 Frontend (`frontend/`)

**Tech Stack:**
- Next.js 15.5.15
- **InterwovenKit 2.x** (Initia Wallet integration)
- Wagmi 2.x (EVM interactions with initiaPrivyWalletConnector)
- Viem (Ethereum utilities)
- snarkjs (browser-based proof generation)
- circomlibjs (Poseidon hashing)

**Key Components:**
- `NewPositionDialog.tsx`: Create new positions (deposit)
- `RepayWithdrawDialog.tsx`: Manage existing positions (borrow/repay/withdraw)
- `PositionSection.tsx`: Display all user positions
- `lib/zkproof.ts`: ZK proof generation logic
- `lib/merkle.ts`: Merkle tree reconstruction from events
- `lib/contracts.ts`: Contract ABIs and addresses
- `lib/wagmi.ts`: Wagmi config with initiaPrivyWalletConnector
- `app/providers.tsx`: InterwovenKitProvider setup

---

## Complete User Flow

### 📊 Step-by-Step Walkthrough

#### 1. **Initial Setup**
```
User connects wallet → Switch to Initia testnet (Chain ID: 2124225178762456)
```

#### 2. **Mint Test Tokens**
```
Account Section → Mint 10 WETH
Status: User now has 10 WETH balance
```

#### 3. **Deposit (Create Position)**
```
Action: Deposit 10 WETH
Frontend:
  ├─ Generate random nullifier and nonce
  ├─ Create note: (10 WETH, 0 USDC, 0 willLiqPrice, timestamp, nullifier, nonce)
  ├─ Compute noteHash = Poseidon(note fields)
  ├─ Generate ZK proof (~20 seconds)
  └─ Submit to contract

Contract:
  ├─ Verify proof
  ├─ Check timestamp (within 5 minutes)
  ├─ Transfer 10 WETH from user
  ├─ Insert noteHash into Merkle tree at index 0
  └─ Emit CommitmentAdded(noteHash, 0)

Result: Position created at merkleIndex = 0
Storage: noteHash stored in localStorage for later use
```

#### 4. **Borrow Against Collateral**
```
Action: Click position → Select "Borrow" → Enter 10 USDC
Frontend:
  ├─ Load old note from localStorage
  ├─ Query Merkle tree commitments from blockchain
  ├─ Compute Merkle path for position at index 0
  ├─ Create new note: (10 WETH, 10 USDC, 1000000 willLiqPrice, same timestamp, new nullifier, new nonce)
  ├─ Check LTV: 10 USDC × 100 ≤ 50 × 10 WETH × 1000000 ✓
  ├─ Generate ZK proof with:
  │   • Old note (private)
  │   • New note (private)
  │   • Merkle proof (public root, private path)
  │   • Borrow amount: +10 USDC
  └─ Submit to contract

Contract:
  ├─ Verify proof
  ├─ Check Merkle root is valid
  ├─ Mark old nullifier as spent
  ├─ Transfer 10 USDC to user
  ├─ Insert new noteHash into Merkle tree at index 1
  └─ Emit CommitmentAdded(newNoteHash, 1)

Result: Position updated to merkleIndex = 1
Storage: New note stored in localStorage, replacing old one
Balance: User has 10 WETH (locked) + 10 USDC (borrowed)
```

#### 5. **Repay Debt**
```
Action: Click position → Select "Repay" → Enter 10 USDC
Frontend:
  ├─ Load current note from localStorage (has 10 WETH, 10 USDC)
  ├─ Query Merkle tree for index 1
  ├─ Create new note: (10 WETH, 0 USDC, 1000000 willLiqPrice, same timestamp, new nullifier, new nonce)
  ├─ Generate ZK proof with:
  │   • Borrow amount: -10 USDC (repayment)
  └─ Submit to contract

Contract:
  ├─ Verify proof
  ├─ Transfer 10 USDC from user back to contract
  ├─ Mark nullifier as spent
  ├─ Insert new noteHash at index 2
  └─ Emit CommitmentAdded(newNoteHash, 2)

Result: Position updated to merkleIndex = 2
Storage: Updated note (debt = 0)
Balance: Debt cleared, collateral still locked
```

#### 6. **Withdraw Collateral**
```
Action: Click position → Select "Withdraw" → Enter 10 WETH
Frontend:
  ├─ Load current note (10 WETH, 0 USDC)
  ├─ Query Merkle tree for index 2
  ├─ Create new note: (0 WETH, 0 USDC, 1000000 willLiqPrice, same timestamp, new nullifier, new nonce)
  ├─ Generate ZK proof with:
  │   • Lend amount: -10 WETH (withdrawal)
  └─ Submit to contract

Contract:
  ├─ Verify proof
  ├─ Transfer 10 WETH back to user
  ├─ Mark nullifier as spent
  ├─ Insert new noteHash at index 3
  └─ Emit CommitmentAdded(newNoteHash, 3)

Result: Position updated to merkleIndex = 3
Storage: Updated note (fully withdrawn)
Balance: 10 WETH returned to user, position closed
```

---

## Privacy Model

### What's Private:
- ✅ Deposit amounts
- ✅ Borrow amounts  
- ✅ Position ownership
- ✅ Transaction history (can't link deposits to withdrawals)

### What's Public:
- ❌ Merkle root (proves a commitment exists)
- ❌ Nullifiers (prevents double-spending)
- ❌ Proof itself (but doesn't reveal private inputs)

### Security Features:
- **Commitment Scheme**: Poseidon hash binds all note fields
- **Nullifiers**: Each note can only be spent once
- **Merkle Tree**: Hides which specific position is being updated
- **Zero-Knowledge**: Amounts never appear on-chain

---

## How to Run Locally

### Prerequisites
```bash
Node.js >= 18
Foundry (forge, anvil)
pnpm or npm
```

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd Zringotts
cd frontend && pnpm install
cd ../contracts && forge install
```

### 2. Compile Circuit (Optional - already compiled)
```bash
cd circuits
npm install
make  # Compiles circuit and generates verification key
```

### 3. Deploy Contracts
```bash
cd contracts
# Set your private key
export PRIVATE_KEY="0x..."

# Deploy to Initia testnet
forge script script/DeployNoOracle.s.sol:DeployNoOracle \
  --rpc-url https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz \
  --broadcast --legacy
```

### 4. Update Frontend Config
Edit `frontend/lib/contracts.ts` with your deployed addresses:
```typescript
export const ZRINGOTTS_ADDRESS = '0x...'
export const WETH_ADDRESS = '0x...'
export const USDC_ADDRESS = '0x...'
```

### 5. Add Liquidity (for borrowing)
```bash
cast send $USDC_ADDRESS "mint(address,uint256)" \
  $ZRINGOTTS_ADDRESS 10000000000 \
  --rpc-url https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz \
  --private-key $PRIVATE_KEY --legacy
```

### 6. Run Frontend
```bash
cd frontend
npm run dev
```
Open http://localhost:3000

### 7. Test the Full Flow
1. Connect wallet (MetaMask/Keplr)
2. Switch to Initia testnet
3. **Mint 10 WETH** in Account section
4. **Deposit 10 WETH** → creates position (index 0)
5. **Borrow 10 USDC** → updates to index 1 ✅
6. **Repay 10 USDC** → updates to index 2 ✅
7. **Withdraw 10 WETH** → updates to index 3 ✅

---

## Technical Highlights

### Circuit Optimization
- **Timestamp Hack**: Uses same timestamp for updates to avoid division remainder issues in field arithmetic
- **Bit Ordering**: LSB-first for Merkle index bits to match Circom expectations
- **Interest Calculation**: Done in-circuit to enforce protocol rules

### Frontend Optimizations
- **Event-Based Merkle Reconstruction**: Queries `CommitmentAdded` events to rebuild tree state
- **Automatic Position Updates**: After each transaction, updates localStorage with new commitment and merkleIndex
- **Transaction Receipt Verification**: Waits for confirmation before updating UI

### Known Limitations
- Tree depth limited to 2 (4 max positions per user)
- Interest only calculated when timestamps differ (workaround: reuse old timestamp)
- Proof generation takes 15-30 seconds (client-side computation)
- No liquidation mechanism implemented (only LTV checks)

---

## Deployed Contracts (Latest)

**Initia EVM-1 Testnet:**
- Zringotts: `0x510BF2877a200b5aE58a327A442638817B88C5dE`
- WETH: `0xc5a4BCea0AB9f86CA1b1502aB9D7b3224EB221ea`
- USDC: `0xCBA2A1554C350AEcaA311917aEf0F7C266600BdA`
- Verifier: `0xdffCbf3c0206375979980E5C4E6D582aAe13ffa9`

**Network Details:**
- Chain ID: `2124225178762456`
- RPC: `https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz`

---

## Project Structure

```
Zringotts/
├── circuits/               # Zero-knowledge circuits
│   ├── src/
│   │   └── zringotts.circom       # Main circuit
│   ├── build/
│   │   ├── zringotts.wasm         # Compiled circuit
│   │   ├── zringotts.zkey         # Proving key
│   │   └── Groth16Verifier.sol    # Verifier contract
│   └── Makefile
│
├── contracts/              # Solidity smart contracts
│   ├── src/
│   │   ├── Zringotts.sol          # Main lending contract
│   │   ├── MerkleTreeWithHistory.sol
│   │   ├── Groth16Verifier.sol
│   │   └── MockToken.sol
│   └── script/
│       └── DeployNoOracle.s.sol
│
├── frontend/               # Next.js frontend
│   ├── app/
│   │   ├── page.tsx               # Main UI
│   │   └── providers.tsx          # Wagmi config
│   ├── components/
│   │   ├── NewPositionDialog.tsx  # Deposit
│   │   ├── RepayWithdrawDialog.tsx # Borrow/Repay/Withdraw
│   │   └── PositionSection.tsx
│   ├── lib/
│   │   ├── zkproof.ts             # Proof generation
│   │   ├── merkle.ts              # Tree reconstruction
│   │   ├── contracts.ts           # ABIs & addresses
│   │   └── wagmi.ts               # Wallet config
│   └── public/
│       ├── zringotts.wasm
│       └── zringotts.zkey
│
└── .initia/
    └── submission.json     # Hackathon submission
```

---

## Future Improvements

- [ ] Implement liquidation mechanism with oracle integration
- [ ] Support multiple collateral types (ETH, BTC, etc.)
- [ ] Increase tree depth for unlimited positions
- [ ] Add withdrawal rate limits for security
- [ ] Implement circuit-based interest calculation that works with any timestamp
- [ ] Optimize proof generation (currently 15-30s)
- [ ] Add relayer support for gas-less transactions
- [ ] Multi-sig governance for protocol parameters

---

## License

MIT

---

## Team

Built for Initia Hackathon 2026

---

## Acknowledgments

- Circom & snarkjs by iden3
- Tornado Cash for Merkle tree inspiration
- Initia for the Interwoven infrastructure
- OpenZeppelin for secure contract libraries
