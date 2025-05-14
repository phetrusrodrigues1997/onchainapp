 // deploy.js
 async function main() {
 const [deployer] = await ethers.getSigners();

 console.log("Deploying contracts with the account:", deployer.address);

//  const balance = await ethers.provider.getBalance(deployer.address);
//  console.log("Account balance:", ethers.formatEther(balance) + " ETH");

 const usdcTokenAddressBase = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

 const USDCLendingPool = await ethers.getContractFactory("USDCLendingPool");

 console.log(`Deploying USDCLendingPool with USDC address: ${usdcTokenAddressBase}...`);
 // In ethers v6, the deploy() method returns a promise that resolves to the deployed contract instance once mined.
 // There is no separate .deployed() function to call.
 const usdcLendingPool = await USDCLendingPool.deploy(usdcTokenAddressBase);

 // To be absolutely sure it's mined and to get the contract instance, you can await the deployment transaction
 // although `await USDCLendingPool.deploy()` should already handle this.
 // For explicit waiting on the transaction to be mined (optional, as deploy() should suffice):
 // await usdcLendingPool.deployTransaction.wait(); 
 // However, the instance `usdcLendingPool` returned by `deploy()` is what you need.

 console.log("USDCLendingPool deployed to:", usdcLendingPool.target);

 // Verification example (requires hardhat-etherscan plugin and configuration)
 // if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
 //   console.log("Verifying contract on Basescan...");
 //   // Wait for a few blocks to ensure Etherscan can pick it up
 //   await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds wait
 //   try {
 //     await hre.run("verify:verify", {
 //       address: usdcLendingPool.address,
 //       constructorArguments: [usdcTokenAddressBase],
 //     });
 //     console.log("Contract verified.");
 //   } catch (error) {
 //     console.error("Verification failed:", error);
 //   }
 // }
 }

 main()
 .then(() => process.exit(0))
 .catch((error) => {
 console.error(error);
 process.exit(1);
 });

