require("dotenv").config();
const hre = require("hardhat");
const { parseUnits, formatUnits } = require("viem");

const ethers = hre.ethers;

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  const VAULT_ADDRESS = "0x6995ca08E9B9bf23d8475Bca8fA1c7455E8ad1cE";
  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // Attach to contracts
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS, signer);
  const vault = await ethers.getContractAt("SimpleVault", VAULT_ADDRESS, signer);

  // Check USDC balance
  const bal = await usdc.balanceOf(signer.address);
  console.log("Your USDC balance is:", formatUnits(bal, 6));
  if (bal < parseUnits("1.0", 6)) {
    console.error("❌ Insufficient USDC balance for 1 USDC deposit");
    process.exit(1);
  }

  // Check vault's strategy configuration
  try {
    const strategyAddress = await vault.strategy();
    console.log("Vault strategy address:", strategyAddress);
    if (strategyAddress === ethers.ZeroAddress) {
      console.error("❌ Vault has no strategy set!");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to fetch strategy address:", error.message);
    process.exit(1);
  }

  // Use Viem to parse 1 USDC (6 decimals) for testing
  const depositAmount = parseUnits("1.0", 6); // Increased to 1 USDC
  console.log("Deposit amount:", formatUnits(depositAmount, 6), "USDC");

  // Check USDC allowance
  const allowance = await usdc.allowance(signer.address, VAULT_ADDRESS);
  console.log("Current USDC allowance for vault:", formatUnits(allowance, 6));
  if (allowance < depositAmount) {
    console.log("Approving vault to spend USDC...");
    await usdc.approve(VAULT_ADDRESS, 0); // Reset allowance
    const approveTx = await usdc.approve(VAULT_ADDRESS, parseUnits("2.0", 6)); // Approve more for flexibility
    await approveTx.wait();
    console.log("✅ Approved 2.0 USDC");
  } else {
    console.log("✅ Sufficient allowance already exists");
  }

  // Deposit into vault
  console.log("Depositing into vault...");
  try {
    const depositTx = await vault.deposit(depositAmount, signer.address, {
      gasLimit: 1000000, // Increased gas limit
    });
    const receipt = await depositTx.wait();
    console.log("✅ Deposited", formatUnits(depositAmount, 6), "USDC");
    console.log("Transaction hash:", receipt.transactionHash);
  } catch (error) {
    console.error("❌ Deposit failed:", error.message);
    if (error.transactionHash) {
      console.error("Transaction hash (check logs on Basescan):", error.transactionHash);
    } else if (error.transaction) {
      console.error("Transaction hash (check logs on Basescan):", error.transaction.hash);
    }
    if (error.data) {
      try {
        const revertReason = await ethers.provider.call({
          to: VAULT_ADDRESS,
          data: error.data,
        });
        console.error("Revert reason:", ethers.utils.toUtf8String(revertReason));
      } catch (decodeError) {
        console.error("Could not decode revert reason:", decodeError.message);
      }
    }
    process.exit(1);
  }

  // Harvest rewards
  console.log("Harvesting rewards...");
  try {
    const harvestTx = await vault.harvest({ gasLimit: 500000 });
    await harvestTx.wait();
    console.log("✅ Harvested rewards");
  } catch (error) {
    console.error("❌ Harvest failed:", error.message);
    process.exit(1);
  }

  // Check sVAULT shares
  const shares = await vault.balanceOf(signer.address);
  console.log(`🎉 You now hold ${formatUnits(shares, 6)} sVAULT tokens`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});