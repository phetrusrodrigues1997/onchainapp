// tokens.ts
export const ETHToken = {
    address: "",
    chainId: 8453,
    vaultAddress: "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1" as const,
    name: "Wrapped ETH",
    symbol: "WETH",
    image: "https://directus.messari.io/assets/12912b0f-3bae-4969-8ddd-99e654af2282"
  };
  
  export const USDCToken = {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chainId: 8453,
    vaultAddress: "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca" as const,
    name: "USDC",
    symbol: "USDC",
    image: "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png"
  };
  
  export const CbBTCToken = {
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    chainId: 8453,
    vaultAddress: "0x543257eF2161176D7C8cD90BA65C2d4CaEF5a796" as const,
    name: "Coinbase Bitcoin",
    symbol: "cbBTC",
    image: "https://basescan.org/token/images/cbbtc_32.png"
  };
  
  export const EURCToken = {
    address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    chainId: 8453,
    vaultAddress: "0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026" as const,
    name: "EURC",
    symbol: "EURC",
    image: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125"
  };
  
  export const tokens = [USDCToken, ETHToken, EURCToken, CbBTCToken];