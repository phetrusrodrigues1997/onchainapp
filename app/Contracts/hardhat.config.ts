import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load .env from the project root (adjust path if needed)
dotenv.config({ path: "../../.env" });

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.base.org", // Your Base RPC URL
        blockNumber: 29971038, // Fork from the block before your failed tx
      },
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;