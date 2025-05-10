require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  // 1) Deploy the vault (no strategy yet)
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  console.log("Deploying SimpleVault with USDC:", USDC);
  const SV = await hre.ethers.getContractFactory("SimpleVault", deployer);
  const vault = await SV.deploy(USDC);
  await vault.waitForDeployment();
  console.log("✅ Vault deployed at:", vault.target);

  // 2) Deploy the strategy, pointing at the vault & the Morpho ERC-4626 wrapper
  console.log("Deploying MorphoUSDCStrategy with vault:", vault.target);
  const MS = await hre.ethers.getContractFactory("MorphoUSDCStrategy", deployer);

  const MORPHO_VAULT = "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca";
  const strat = await MS.deploy(vault.target, MORPHO_VAULT);
  await strat.waitForDeployment();
  console.log("✅ Strategy deployed at:", strat.target);

  // 3) Wire them up: vault.setStrategy(strat)
  console.log("Setting strategy on vault...");
  const tx = await vault.connect(deployer).setStrategy(strat.target);
  await tx.wait();
  console.log("🔗 Vault strategy set to:", strat.target);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
