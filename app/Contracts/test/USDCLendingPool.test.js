const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("USDCLendingPool", function () {
  let USDC, LendingPool;
  let usdc, lendingPool;
  let owner, supplier1, supplier2, borrower, reserveWithdrawalAddress;
  const USDC_DECIMALS = 6;
  const toUSDC = (amount) => ethers.utils.parseUnits(amount.toString(), USDC_DECIMALS);
  const fromUSDC = (amount) => ethers.utils.formatUnits(amount, USDC_DECIMALS);

  beforeEach(async function () {
    // Get signers
    [owner, supplier1, supplier2, borrower, reserveWithdrawalAddress] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.deployed();

    // Deploy USDCLendingPool
    const USDCLendingPool = await ethers.getContractFactory("USDCLendingPool");
    lendingPool = await USDCLendingPool.deploy(usdc.address, reserveWithdrawalAddress.address);
    await lendingPool.deployed();

    // Mint USDC to test accounts
    await usdc.mint(supplier1.address, toUSDC(10000));
    await usdc.mint(supplier2.address, toUSDC(10000));
    await usdc.mint(borrower.address, toUSDC(10000));

    // Approve LendingPool to spend USDC
    await usdc.connect(supplier1).approve(lendingPool.address, ethers.constants.MaxUint256);
    await usdc.connect(supplier2).approve(lendingPool.address, ethers.constants.MaxUint256);
    await usdc.connect(borrower).approve(lendingPool.address, ethers.constants.MaxUint256);
  });

  it("should allow users to supply USDC and accrue interest", async function () {
    // Supplier1 supplies 1000 USDC
    await lendingPool.connect(supplier1).supply(toUSDC(1000));
    expect(await lendingPool.suppliedBalances(supplier1.address)).to.equal(toUSDC(1000));
    expect(await lendingPool.totalSupplied()).to.equal(toUSDC(1000));

    // Advance time to accrue interest (1 day)
    await time.increase(86400);

    // Check supplier1's accrued interest
    const suppliedBalanceWithInterest = await lendingPool.getSuppliedBalanceWithInterest(supplier1.address);
    expect(suppliedBalanceWithInterest).to.be.gt(toUSDC(1000)); // Should include some interest

    // Supplier1 claims interest
    const initialBalance = await usdc.balanceOf(supplier1.address);
    await lendingPool.connect(supplier1).claimInterest();
    const finalBalance = await usdc.balanceOf(supplier1.address);
    expect(finalBalance).to.be.gt(initialBalance);
    expect(await lendingPool.suppliedInterestBalances(supplier1.address)).to.equal(0);
  });

  it("should allow borrowing and accrue interest", async function () {
    // Supplier1 supplies 1000 USDC
    await lendingPool.connect(supplier1).supply(toUSDC(1000));

    // Borrower supplies 500 USDC as collateral and borrows 300 USDC (within 75% LTV)
    await lendingPool.connect(borrower).supply(toUSDC(500));
    await lendingPool.connect(borrower).borrow(toUSDC(300));
    expect(await lendingPool.borrowedPrincipals(borrower.address)).to.equal(toUSDC(300));
    expect(await lendingPool.totalBorrowed()).to.equal(toUSDC(300));

    // Advance time to accrue interest (1 day)
    await time.increase(86400);

    // Check borrower's debt with interest
    const debtWithInterest = await lendingPool.getBorrowedBalanceWithInterest(borrower.address);
    expect(debtWithInterest).to.be.gt(toUSDC(300)); // Includes interest
  });

  it("should allow repayment of loan", async function () {
    // Supplier1 supplies 1000 USDC
    await lendingPool.connect(supplier1).supply(toUSDC(1000));

    // Borrower supplies 500 USDC and borrows 300 USDC
    await lendingPool.connect(borrower).supply(toUSDC(500));
    await lendingPool.connect(borrower).borrow(toUSDC(300));

    // Advance time to accrue interest
    await time.increase(86400);

    // Borrower repays full debt
    const debtWithInterest = await lendingPool.getBorrowedBalanceWithInterest(borrower.address);
    const initialBalance = await usdc.balanceOf(borrower.address);
    await lendingPool.connect(borrower).repayBorrow(debtWithInterest);
    expect(await lendingPool.borrowedPrincipals(borrower.address)).to.equal(0);
    expect(await lendingPool.totalBorrowed()).to.equal(0);
    expect(await usdc.balanceOf(borrower.address)).to.be.lt(initialBalance);
  });

  it("should liquidate undercollateralized borrower and distribute interest", async function () {
    // Supplier1 and Supplier2 supply 1000 USDC each
    await lendingPool.connect(supplier1).supply(toUSDC(1000));
    await lendingPool.connect(supplier2).supply(toUSDC(1000));
    expect(await lendingPool.totalSupplied()).to.equal(toUSDC(2000));

    // Borrower supplies 500 USDC and borrows 375 USDC (max LTV 75%)
    await lendingPool.connect(borrower).supply(toUSDC(500));
    await lendingPool.connect(borrower).borrow(toUSDC(375));

    // Advance time to accrue significant interest (30 days)
    await time.increase(30 * 86400);

    // Check borrower's debt exceeds supply (liquidation threshold 80%)
    const debtWithInterest = await lendingPool.getBorrowedBalanceWithInterest(borrower.address);
    const supplyWithInterest = await lendingPool.getSuppliedBalanceWithInterest(borrower.address);
    expect(debtWithInterest).to.be.gt(supplyWithInterest);

    // Get initial supplier balances
    const supplier1InitialInterest = await lendingPool.suppliedInterestBalances(supplier1.address);
    const supplier2InitialInterest = await lendingPool.suppliedInterestBalances(supplier2.address);
    const reserveInitialBalance = await usdc.balanceOf(reserveWithdrawalAddress.address);

    // Liquidate borrower
    await lendingPool.connect(owner).liquidate(borrower.address);

    // Verify borrower's balances are cleared
    expect(await lendingPool.borrowedPrincipals(borrower.address)).to.equal(0);
    expect(await lendingPool.suppliedBalances(borrower.address)).to.equal(0);
    expect(await lendingPool.totalBorrowed()).to.equal(0);
    expect(await lendingPool.totalSupplied()).to.equal(toUSDC(2000 - 500)); // Borrower's 500 USDC collateral seized

    // Verify interest distributed to suppliers
    const supplier1FinalInterest = await lendingPool.suppliedInterestBalances(supplier1.address);
    const supplier2FinalInterest = await lendingPool.suppliedInterestBalances(supplier2.address);
    expect(supplier1FinalInterest).to.be.gt(supplier1InitialInterest);
    expect(supplier2FinalInterest).to.be.gt(supplier2InitialInterest);

    // Verify collateral (principal) sent to reserveWithdrawalAddress
    const reserveFinalBalance = await usdc.balanceOf(reserveWithdrawalAddress.address);
    expect(reserveFinalBalance).to.be.gt(reserveInitialBalance);
    expect(reserveFinalBalance).to.be.lte(toUSDC(375)); // Up to borrower's principal debt

    // Verify reserve share
    const totalReserves = await lendingPool.totalReserves();
    expect(totalReserves).to.be.gt(0); // Reserve factor (10%) of interest
  });

  it("should liquidate matured loan and distribute interest", async function () {
    // Supplier1 and Supplier2 supply 1000 USDC each
    await lendingPool.connect(supplier1).supply(toUSDC(1000));
    await lendingPool.connect(supplier2).supply(toUSDC(1000));

    // Borrower supplies 500 USDC and borrows 300 USDC
    await lendingPool.connect(borrower).supply(toUSDC(500));
    await lendingPool.connect(borrower).borrow(toUSDC(300));

    // Advance time beyond loan maturity (1 day)
    await time.increase(2 * 86400);

    // Get initial supplier balances
    const supplier1InitialInterest = await lendingPool.suppliedInterestBalances(supplier1.address);
    const supplier2InitialInterest = await lendingPool.suppliedInterestBalances(supplier2.address);
    const reserveInitialBalance = await usdc.balanceOf(reserveWithdrawalAddress.address);

    // Liquidate borrower
    await lendingPool.connect(owner).liquidate(borrower.address);

    // Verify borrower's balances are cleared
    expect(await lendingPool.borrowedPrincipals(borrower.address)).to.equal(0);
    expect(await lendingPool.suppliedBalances(borrower.address)).to.equal(0);
    expect(await lendingPool.totalBorrowed()).to.equal(0);
    expect(await lendingPool.totalSupplied()).to.equal(toUSDC(2000 - 500));

    // Verify interest distributed to suppliers
    const supplier1FinalInterest = await lendingPool.suppliedInterestBalances(supplier1.address);
    const supplier2FinalInterest = await lendingPool.suppliedInterestBalances(supplier2.address);
    expect(supplier1FinalInterest).to.be.gt(supplier1InitialInterest);
    expect(supplier2FinalInterest).to.be.gt(supplier2InitialInterest);

    // Verify collateral sent to reserveWithdrawalAddress
    const reserveFinalBalance = await usdc.balanceOf(reserveWithdrawalAddress.address);
    expect(reserveFinalBalance).to.be.gt(reserveInitialBalance);
    expect(reserveFinalBalance).to.be.lte(toUSDC(300)); // Up to borrower's principal debt
  });

  it("should handle low liquidity in liquidation", async function () {
    // Supplier1 supplies 1000 USDC
    await lendingPool.connect(supplier1).supply(toUSDC(1000));

    // Borrower supplies 500 USDC and borrows 300 USDC
    await lendingPool.connect(borrower).supply(toUSDC(500));
    await lendingPool.connect(borrower).borrow(toUSDC(300));

    // Simulate low liquidity by withdrawing most USDC (manually transfer out)
    await lendingPool.connect(supplier1).withdraw(toUSDC(800));
    expect(await usdc.balanceOf(lendingPool.address)).to.equal(toUSDC(200)); // 500 - 300 = 200 USDC left

    // Advance time to accrue interest
    await time.increase(30 * 86400);

    // Get initial supplier interest
    const supplier1InitialInterest = await lendingPool.suppliedInterestBalances(supplier1.address);

    // Liquidate borrower
    await lendingPool.connect(owner).liquidate(borrower.address);

    // Verify interest distributed despite low liquidity
    const supplier1FinalInterest = await lendingPool.suppliedInterestBalances(supplier1.address);
    expect(supplier1FinalInterest).to.be.gt(supplier1InitialInterest);

    // Verify collateral sent to reserveWithdrawalAddress, capped by contract balance
    const reserveBalance = await usdc.balanceOf(reserveWithdrawalAddress.address);
    expect(reserveBalance).to.be.lte(toUSDC(200)); // Capped by available liquidity
  });

  it("should handle reserve withdrawals after liquidation", async function () {
    // Supplier1 supplies 1000 USDC
    await lendingPool.connect(supplier1).supply(toUSDC(1000));

    // Borrower supplies 500 USDC and borrows 300 USDC
    await lendingPool.connect(borrower).supply(toUSDC(500));
    await lendingPool.connect(borrower).borrow(toUSDC(300));

    // Advance time to accrue interest
    await time.increase(30 * 86400);

    // Liquidate borrower
    await lendingPool.connect(owner).liquidate(borrower.address);

    // Check totalReserves (should include 10% of accrued interest)
    const totalReserves = await lendingPool.totalReserves();
    expect(totalReserves).to.be.gt(toUSDC(0));

    // Trigger auto-withdrawal of reserves
    await lendingPool.connect(supplier1).supply(toUSDC(100)); // Triggers _autoWithdrawReserves
    expect(await lendingPool.totalReserves()).to.equal(0);
    const reserveBalance = await usdc.balanceOf(reserveWithdrawalAddress.address);
    expect(reserveBalance).to.be.gt(toUSDC(300)); // Includes collateral + reserve share
  });
});

// MockUSDC contract for testing
const { artifacts } = require("hardhat");

const MockUSDCArtifact = artifacts.readArtifactSync("MockUSDC") || {
  abi: [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
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
          "name": "amount",
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
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
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
          "name": "amount",
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
          "name": "amount",
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
  ],
  bytecode: "0x" // Placeholder, Hardhat will compile
};

// Deploy MockUSDC contract before tests
before(async function () {
  const MockUSDC = await ethers.getContractFactory("MockUSDC", {
    signer: owner,
    libraries: {},
    contract: {
      abi: MockUSDCArtifact.abi,
      bytecode: MockUSDCArtifact.bytecode
    }
  });
  usdc = await MockUSDC.deploy();
  await usdc.deployed();
});