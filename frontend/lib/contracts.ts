export const ZRINGOTTS_ADDRESS =
  (process.env.NEXT_PUBLIC_ZRINGOTTS_ADDRESS ?? '0x510BF2877a200b5aE58a327A442638817B88C5dE') as `0x${string}`;

export const WETH_ADDRESS =
  (process.env.NEXT_PUBLIC_WETH_ADDRESS ?? '0xc5a4BCea0AB9f86CA1b1502aB9D7b3224EB221ea') as `0x${string}`;

export const USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '0xCBA2A1554C350AEcaA311917aEf0F7C266600BdA') as `0x${string}`;

export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const ZRINGOTTS_ABI = [
  {
    inputs: [],
    name: 'state',
    outputs: [
      { name: 'weth_deposit_amount', type: 'int256' },
      { name: 'weth_borrow_amount', type: 'int256' },
      { name: 'usdc_deposit_amount', type: 'int256' },
      { name: 'usdc_borrow_amount', type: 'int256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getLastRoot',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextIndex',
    outputs: [{ name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'flatten_liquidated_array',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'commitments',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_root', type: 'bytes32' }],
    name: 'isKnownRoot',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'commitment', type: 'bytes32' },
      { indexed: true, name: 'leafIndex', type: 'uint32' },
    ],
    name: 'CommitmentAdded',
    type: 'event',
  },
  {
    inputs: [
      { name: '_new_note_hash',      type: 'bytes32'       },
      { name: '_new_will_liq_price', type: 'bytes32'       },
      { name: '_new_timestamp',      type: 'uint256'       },
      { name: '_root',               type: 'bytes32'       },
      { name: '_old_nullifier',      type: 'bytes32'       },
      { name: '_pA',                 type: 'uint256[2]'    },
      { name: '_pB',                 type: 'uint256[2][2]' },
      { name: '_pC',                 type: 'uint256[2]'    },
      { name: '_lend_amt',           type: 'uint256'       },
      { name: '_lend_token',         type: 'address'       },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_new_note_hash',      type: 'bytes32'       },
      { name: '_new_will_liq_price', type: 'bytes32'       },
      { name: '_new_timestamp',      type: 'uint256'       },
      { name: '_root',               type: 'bytes32'       },
      { name: '_old_nullifier',      type: 'bytes32'       },
      { name: '_pA',                 type: 'uint256[2]'    },
      { name: '_pB',                 type: 'uint256[2][2]' },
      { name: '_pC',                 type: 'uint256[2]'    },
      { name: '_borrow_amt',         type: 'uint256'       },
      { name: '_borrow_token',       type: 'address'       },
      { name: '_to',                 type: 'address'       },
    ],
    name: 'borrow',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_new_note_hash',      type: 'bytes32'       },
      { name: '_new_will_liq_price', type: 'bytes32'       },
      { name: '_new_timestamp',      type: 'uint256'       },
      { name: '_root',               type: 'bytes32'       },
      { name: '_old_nullifier',      type: 'bytes32'       },
      { name: '_pA',                 type: 'uint256[2]'    },
      { name: '_pB',                 type: 'uint256[2][2]' },
      { name: '_pC',                 type: 'uint256[2]'    },
      { name: '_repay_amt',          type: 'uint256'       },
      { name: '_repay_token',        type: 'address'       },
    ],
    name: 'repay',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_new_note_hash',      type: 'bytes32'       },
      { name: '_new_will_liq_price', type: 'bytes32'       },
      { name: '_new_timestamp',      type: 'uint256'       },
      { name: '_root',               type: 'bytes32'       },
      { name: '_old_nullifier',      type: 'bytes32'       },
      { name: '_pA',                 type: 'uint256[2]'    },
      { name: '_pB',                 type: 'uint256[2][2]' },
      { name: '_pC',                 type: 'uint256[2]'    },
      { name: '_withdraw_amt',       type: 'uint256'       },
      { name: '_withdraw_token',     type: 'address'       },
      { name: '_to',                 type: 'address'       },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_new_note_hash',      type: 'bytes32'       },
      { name: '_new_will_liq_price', type: 'bytes32'       },
      { name: '_new_timestamp',      type: 'uint256'       },
      { name: '_root',               type: 'bytes32'       },
      { name: '_old_nullifier',      type: 'bytes32'       },
      { name: '_pA',                 type: 'uint256[2]'    },
      { name: '_pB',                 type: 'uint256[2][2]' },
      { name: '_pC',                 type: 'uint256[2]'    },
      { name: '_claim_amt',          type: 'uint256'       },
      { name: '_claim_token',        type: 'address'       },
      { name: '_to',                 type: 'address'       },
    ],
    name: 'claim',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

export const currencies = {
  weth: {
    address: WETH_ADDRESS,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    icon: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    faucetAmount: BigInt('1000000000000000000'), // 1 WETH
  },
  usdc: {
    address: USDC_ADDRESS,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    icon: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    faucetAmount: BigInt('1000000000'), // 1000 USDC
  },
} as const;
