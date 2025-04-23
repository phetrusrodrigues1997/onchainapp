import { ethers as hardhatEthers } from "hardhat";
import { parseUnits, formatUnits, BigNumberish } from "ethers";

async function main() {
  const contractAddress = "0x3F2d6160c04E19e96483A95F2036367687626989"; // Deployed SyntheticGold
  const USDCAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base Mainnet

  const [signer] = await hardhatEthers.getSigners();
  console.log("Interacting with:", signer.address);

  // Check USDC balance
  const usdc = await hardhatEthers.getContractAt("IERC20", USDCAddress, signer);
  const usdcBalance = await usdc.balanceOf(signer.address);
  console.log(`USDC Balance: ${formatUnits(usdcBalance, 6)}`);

  // Approve and Mint
  const amountToUse: BigNumberish = parseUnits("0.09", 6); // 0.09 USDC for testing
  const approveTx = await usdc.approve(contractAddress, amountToUse);
  await approveTx.wait();
  console.log(`✅ Approved ${formatUnits(amountToUse, 6)} USDC`);

 // Define minimal ABI for SyntheticGold with explicit view function
const syntheticGoldAbi = [
  "function mint(uint256 collateralAmount) external",
  "function burn(uint256 sGoldAmount) external",
  "function getTWAP() external view returns (uint256)", // Ensure view is specified
  "function balanceOf(address account) external view returns (uint256)",
];
  const synthetic = await hardhatEthers.getContractAt(syntheticGoldAbi, contractAddress, signer);

  const mintTx = await synthetic.mint(amountToUse);
  await mintTx.wait();
  console.log(`🚀 Minted geGOLD using ${formatUnits(amountToUse, 6)} USDC`);

  // Check geGOLD balance
  const geGoldBalance = await synthetic.balanceOf(signer.address);
  console.log(`geGOLD Balance: ${formatUnits(geGoldBalance, 18)}`);

 // Check price feed
const price: BigNumberish = await synthetic.getTWAP(); // Should return uint256 directly
console.log(`Gold/USD Price: ${formatUnits(price, 8)}`);

  // Burn geGOLD
  const burnAmount: BigNumberish = parseUnits("0.000000000000000017", 18); // Adjust based on balance
  const burnTx = await synthetic.burn(burnAmount);
  await burnTx.wait();
  console.log(`🔥 Burned ${formatUnits(burnAmount, 18)} geGOLD`);

  // Check final balances
  const finalGeGoldBalance = await synthetic.balanceOf(signer.address);
  const finalUsdcBalance = await usdc.balanceOf(signer.address);
  console.log(`Final geGOLD Balance: ${formatUnits(finalGeGoldBalance, 18)}`);
  console.log(`Final USDC Balance: ${formatUnits(finalUsdcBalance, 6)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});