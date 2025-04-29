const { ethers } = require("hardhat");
const { formatUnits } = require("ethers");

const OracleAddress = "0x5213eBB69743b85644dbB6E25cdF994aFBb8cF31";

const ORACLE_ABI = [
  "function getTWAP() external view returns (uint256)",
];

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);

  const oracle = new ethers.Contract(OracleAddress, ORACLE_ABI, signer);

  try {
    const price = await oracle.getTWAP();
    console.log(`Oracle TWAP Price: ${formatUnits(price, 8)} USD per XAU`);
  } catch (err) {
    console.error("Error calling getTWAP:", err);
  }
}

main().catch((err) => {
  console.error("Error in script:", err);
  process.exit(1);
});