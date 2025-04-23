const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const USDCAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base Mainnet
  const ETHUSDOracleAddress = "0x5213eBB69743b85644dbB6E25cdF994aFBb8cF31"; // XAU/USD on Base Mainnet

  const SyntheticETH = await hre.ethers.getContractFactory("SyntheticGold");
  console.log("Deploying GoldenEagle Gold...");

  const syntheticETH = await SyntheticETH.deploy(USDCAddress, ETHUSDOracleAddress);
  const receipt = await syntheticETH.deploymentTransaction().wait(); // Wait for deployment confirmation
  console.log("GoldenEagle Gold deployed to:", receipt.contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });