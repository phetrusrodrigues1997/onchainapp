const { ethers } = require("hardhat");
const { BigNumber } = ethers;
const { parseUnits, formatUnits } = require('viem');

// --- CONFIGURATION ---
const VAULT_ADDRESS = "0xB3500f2c6B2eCCA43814340C5Cf89A1EabF47424";
const STRATEGY_ADDRESS = "0xB95901EfaE9ac91772B8a9a33ad34Bc6ADf00C3D";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const MORPHO_VAULT_ADDRESS = "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca"; // From deploy.js



// --- ABIs (PLACEHOLDERS - User must replace with actual ABIs from their project's artifacts) ---
const SIMPLE_VAULT_ABI = [
    {
        "inputs": [
            {
                "internalType": "contract IERC20Metadata",
                "name": "_underlying",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "allowance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "needed",
                "type": "uint256"
            }
        ],
        "name": "ERC20InsufficientAllowance",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "balance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "needed",
                "type": "uint256"
            }
        ],
        "name": "ERC20InsufficientBalance",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "approver",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidApprover",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidReceiver",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidSender",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidSpender",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "max",
                "type": "uint256"
            }
        ],
        "name": "ERC4626ExceededMaxDeposit",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "max",
                "type": "uint256"
            }
        ],
        "name": "ERC4626ExceededMaxMint",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "max",
                "type": "uint256"
            }
        ],
        "name": "ERC4626ExceededMaxRedeem",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "max",
                "type": "uint256"
            }
        ],
        "name": "ERC4626ExceededMaxWithdraw",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ReentrancyGuardReentrantCall",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "SafeERC20FailedOperation",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            }
        ],
        "name": "Deposit",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            }
        ],
        "name": "Withdraw",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "asset",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            }
        ],
        "name": "convertToAssets",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            }
        ],
        "name": "convertToShares",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "deposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "harvest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "maxDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "maxMint",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "maxRedeem",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "maxWithdraw",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "mint",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            }
        ],
        "name": "previewDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            }
        ],
        "name": "previewMint",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            }
        ],
        "name": "previewRedeem",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            }
        ],
        "name": "previewWithdraw",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "shares",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "redeem",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_strategy",
                "type": "address"
            }
        ],
        "name": "setStrategy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "strategy",
        "outputs": [
            {
                "internalType": "contract ICometUSDCStrategy",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalAssets",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "assets",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "withdraw",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const MORPHO_STRATEGY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_vault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_morphoVault",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "emergencyWithdrawToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "harvest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "morphoVault",
    "outputs": [
      {
        "internalType": "contract IERC4626",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vault",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const ERC20_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "allowance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientAllowance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSpender",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

// --- HELPER FUNCTIONS ---
async function getUSDCInfo(usdcContract) {
    try {
        return await usdcContract.decimals();
    } catch (e) {
        console.warn("Could not fetch USDC decimals, defaulting to 6. Error:", e.message);
        return 6; // Default to 6 if not found or error
    }
}

async function getVaultDecimals(vaultContract) {
    try {
        return await vaultContract.decimals();
    } catch (e) {
        console.warn("Could not fetch vault decimals, defaulting to 6. Error:", e.message);
        return 6; // Default to 6 if not found or error
    }
}

function parseAmount(amountStr, decimals) {
    // Convert decimals to a number if it’s a BigInt
    if (typeof decimals === 'bigint') {
        decimals = Number(decimals);
    }

    // Ensure decimals is a number; if not, attempt to convert it
    if (typeof decimals !== 'number') {
        console.error('decimals is not a number:', decimals, typeof decimals);
        decimals = Number(decimals);
    }

    // Log for debugging purposes
    console.log('Parsing amount:', amountStr, 'with decimals:', decimals);

    // Parse the amount using viem's parseUnits
    return parseUnits(amountStr, decimals);
}

function formatAmount(amountBigNum, decimals) {
    // Ensure amountBigNum is a BigInt
    if (typeof amountBigNum !== 'bigint') {
        console.error('amountBigNum is not a BigInt:', amountBigNum, typeof amountBigNum);
        amountBigNum = BigInt(amountBigNum.toString());
    }

    // Convert decimals to number if it’s a BigInt
    if (typeof decimals === 'bigint') {
        decimals = Number(decimals);
    }

    // Validate that decimals is now a number
    if (typeof decimals !== 'number') {
        console.error('decimals is not a number:', decimals, typeof decimals);
        decimals = Number(decimals);
    }

    console.log('Formatting amount:', amountBigNum.toString(), 'with decimals:', decimals);
    return formatUnits(amountBigNum, decimals); // Assuming formatUnits is from viem
}

async function logSeparator(title = "") {
    console.log(`\n--- ${title} ${Date.now()} ---`);
}

// --- MAIN LOGIC (AUTOMATED TEST SEQUENCE) ---
async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    const simpleVault = new ethers.Contract(VAULT_ADDRESS, SIMPLE_VAULT_ABI, signer);
    const morphoStrategy = new ethers.Contract(STRATEGY_ADDRESS, MORPHO_STRATEGY_ABI, signer);
    const usdcToken = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);

    const usdcDecimals = await getUSDCInfo(usdcToken);
    const vaultDecimals = await getVaultDecimals(simpleVault);
    console.log(`USDC Decimals: ${usdcDecimals}, Vault Share Decimals: ${vaultDecimals}`);

    console.log(`
    ----------------------------------------------------------------
    IMPORTANT: 
    1. The SimpleVault ABI has been updated based on your SimpleVault.json.
    2. Please ensure the placeholder ABIs for MORPHO_STRATEGY_ABI and 
       ERC20_ABI are replaced with actual ABIs from your project if needed.
    3. This script uses the first signer from Hardhat. Ensure it has USDC.
    4. This script will run a predefined sequence of operations.
    ----------------------------------------------------------------
    `);

    try {
        // --- Test Parameters ---
        const depositAmountStr = "0.1"; // Deposit 0.1 USDC
        const withdrawAmountStr = "0.05"; // Withdraw 0.05 USDC

        // 1. GET INITIAL BALANCES
        await logSeparator("INITIAL STATE");
        let initialSignerUSDC = await usdcToken.balanceOf(signer.address);
        console.log(`Initial Signer USDC Balance: ${formatAmount(initialSignerUSDC, usdcDecimals)} USDC`);
        let initialVaultAssets = await simpleVault.totalAssets();
        console.log(`Initial Vault Total Assets: ${formatAmount(initialVaultAssets, usdcDecimals)} USDC`);
        let initialUserShares = await simpleVault.balanceOf(signer.address);
        console.log(`Initial User Share Balance in Vault: ${formatAmount(initialUserShares, vaultDecimals)} sVAULT`);
        
        // 2. DEPOSIT
        await logSeparator("DEPOSIT OPERATION");
        const depositAmount = parseAmount(depositAmountStr, usdcDecimals);
        console.log(`Attempting to deposit ${depositAmountStr} USDC...`);
        
        const allowance = await usdcToken.allowance(signer.address, simpleVault.address);
        if (allowance.lt(depositAmount)) {
            console.log("Approving SimpleVault to spend USDC...");
            const approveTx = await usdcToken.approve(simpleVault.address, ethers.constants.MaxUint256);
            await approveTx.wait();
            console.log("Approval successful. Tx hash:", approveTx.hash);
        } else {
            console.log("Sufficient allowance already set.");
        }

        const depositTx = await simpleVault.deposit(depositAmount, signer.address);
        console.log("Deposit transaction sent. Waiting for confirmation...");
        await depositTx.wait();
        console.log(`✅ Deposit successful! Tx hash: ${depositTx.hash}`);

        // 3. CHECK BALANCES AFTER DEPOSIT
        await logSeparator("STATE AFTER DEPOSIT");
        let signerUSDCAfterDeposit = await usdcToken.balanceOf(signer.address);
        console.log(`Signer USDC Balance after deposit: ${formatAmount(signerUSDCAfterDeposit, usdcDecimals)} USDC`);
        let vaultAssetsAfterDeposit = await simpleVault.totalAssets();
        console.log(`Vault Total Assets after deposit: ${formatAmount(vaultAssetsAfterDeposit, usdcDecimals)} USDC`);
        let userSharesAfterDeposit = await simpleVault.balanceOf(signer.address);
        console.log(`User Share Balance in Vault after deposit: ${formatAmount(userSharesAfterDeposit, vaultDecimals)} sVAULT`);
        let userAssetsInVault = await simpleVault.convertToAssets(userSharesAfterDeposit);
        console.log(`User Asset Value in Vault after deposit: ${formatAmount(userAssetsInVault, usdcDecimals)} USDC`);

        // 4. WITHDRAW
        await logSeparator("WITHDRAW OPERATION");
        const withdrawAssets = parseAmount(withdrawAmountStr, usdcDecimals);
        console.log(`Attempting to withdraw ${withdrawAmountStr} USDC worth of assets...`);
        
        // Ensure user has enough shares to withdraw this amount of assets
        if (userAssetsInVault.lt(withdrawAssets)) {
            console.warn(`⚠️ Warning: User does not have enough assets (${formatAmount(userAssetsInVault, usdcDecimals)} USDC) to withdraw ${withdrawAmountStr} USDC. Skipping withdrawal.`);
        } else {
            const withdrawTx = await simpleVault.withdraw(withdrawAssets, signer.address, signer.address);
            console.log("Withdraw transaction sent. Waiting for confirmation...");
            await withdrawTx.wait();
            console.log(`✅ Withdraw successful! Tx hash: ${withdrawTx.hash}`);
        }

        // 5. CHECK BALANCES AFTER WITHDRAW
        await logSeparator("STATE AFTER WITHDRAW");
        let signerUSDCAfterWithdraw = await usdcToken.balanceOf(signer.address);
        console.log(`Signer USDC Balance after withdraw: ${formatAmount(signerUSDCAfterWithdraw, usdcDecimals)} USDC`);
        let vaultAssetsAfterWithdraw = await simpleVault.totalAssets();
        console.log(`Vault Total Assets after withdraw: ${formatAmount(vaultAssetsAfterWithdraw, usdcDecimals)} USDC`);
        let userSharesAfterWithdraw = await simpleVault.balanceOf(signer.address);
        console.log(`User Share Balance in Vault after withdraw: ${formatAmount(userSharesAfterWithdraw, vaultDecimals)} sVAULT`);
        let userAssetsInVaultAfterWithdraw = await simpleVault.convertToAssets(userSharesAfterWithdraw);
        console.log(`User Asset Value in Vault after withdraw: ${formatAmount(userAssetsInVaultAfterWithdraw, usdcDecimals)} USDC`);

        // 6. HARVEST
        await logSeparator("HARVEST OPERATION");
        console.log("Attempting to call harvest on SimpleVault...");
        const harvestTx = await simpleVault.harvest();
        console.log("Harvest transaction sent. Waiting for confirmation...");
        await harvestTx.wait();
        console.log(`✅ Harvest successful! Tx hash: ${harvestTx.hash} (Note: MorphoUSDCStrategy harvest is a no-op)`);

        // 7. GET STRATEGY DETAILS
        await logSeparator("STRATEGY DETAILS");
        const strategyAddress = await simpleVault.strategy();
        console.log(`Current Vault Strategy Address: ${strategyAddress}`);
        if (strategyAddress.toLowerCase() !== STRATEGY_ADDRESS.toLowerCase()) {
            console.warn("Warning: Deployed strategy address in vault does not match STRATEGY_ADDRESS in script.");
        }
        console.log("Fetching MorphoUSDCStrategy details...");
        const stratUsdc = await morphoStrategy.usdc();
        const stratMorphoVault = await morphoStrategy.morphoVault();
        const stratOwningVault = await morphoStrategy.vault();
        console.log(`Strategy's USDC Address: ${stratUsdc}`);
        console.log(`Strategy's Morpho Vault Address: ${stratMorphoVault}`);
        console.log(`Strategy's Owning Vault (SimpleVault) Address: ${stratOwningVault}`);

        await logSeparator("AUTOMATED TEST SEQUENCE COMPLETE");

    } catch (error) {
        console.error("❌ Error during automated test sequence:", error.message);
        if (error.data) console.error("Error data:", error.data);
        if (error.transactionHash) console.error("Transaction hash:", error.transactionHash);
        process.exitCode = 1; 
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });

