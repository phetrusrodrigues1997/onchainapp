// scripts/deploy.js
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying SimpleVault to network ${hre.network.name}`);
  console.log("Deploying from:", deployer.address);

  const UNDERLYING_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  const SimpleVault = await hre.ethers.getContractFactory("SimpleVault", deployer);
  console.log("⛏  Deploying SimpleVault…");
  const vault = await SimpleVault.deploy(UNDERLYING_TOKEN);

  // Option B: wait for deployment via Ethers v6 helper
  await vault.waitForDeployment();

  // Now vault.target contains the address
  console.log("✅  SimpleVault deployed to:", vault.target);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
