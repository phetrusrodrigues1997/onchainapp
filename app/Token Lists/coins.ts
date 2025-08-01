import type { Token } from '@coinbase/onchainkit/token';


// Token definitions
export const ETHToken: Token = {
  address: "",
  chainId: 8453,
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  image:
    "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
};

export const WETHToken: Token = {
  address: "0x4200000000000000000000000000000000000006",
  chainId: 8453,
  decimals: 18,
  name: "Wrapped Eth",
  symbol: "WETH",
  image:
    "https://directus.messari.io/assets/12912b0f-3bae-4969-8ddd-99e654af2282",
};

export const AEROToken: Token = {
  address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631", // Replace with the actual contract address
  chainId: 8453, // Replace with the actual chain ID
  decimals: 18, // Replace with the actual decimals if different
  name: "Aerodrome Finance",
  symbol: "AERO",
  image: "https://basescan.org/token/images/aerodrome_32.png", // Replace with the actual image URL
};

export const VIRTUALToken: Token = {
  address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b", // Contract address on Ethereum
  chainId: 8453, // Base
  decimals: 18, // Replace with the actual decimals if different
  name: "Virtuals Protocol",
  symbol: "VIRTUAL",
  image: "https://basescan.org/token/images/virtualprotocol_32.png", // Replace with the actual image URL
};

export const CbBTCToken: Token = {
  address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  chainId: 8453,
  decimals: 8,
  name: "Coinbase BTC",
  symbol: "BTC",
  image: "https://basescan.org/token/images/cbbtc_32.png",
};

export const AAVEToken: Token = {
  address: "0x63706e401c06ac8513145b7687A14804d17f814b", // Aave token contract address on Base
  chainId: 8453, // Base network chain ID
  decimals: 18,
  name: "Aave",
  symbol: "AAVE",
  image: "https://basescan.org/token/images/aave_32.svg", // Aave logo
};

export const MORPHOToken: Token = {
  address: "0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842", // Replace with actual Base address
  chainId: 8453,
  decimals: 18,
  name: "Morpho",
  symbol: "MORPHO",
  image: "https://basescan.org/token/images/morphoorg_new_32.png", // Replace with Base-specific logo if available
};


export const USDCToken: Token = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: 8453,
  decimals: 6,
  name: "USDC",
  symbol: "USDC",
  image:
    "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
};

export const EURCToken: Token = {
  address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
  chainId: 8453,
  decimals: 6,
  name: "EURC",
  symbol: "EURC",
  image: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
};

export const CADCToken: Token = {
  address: "0x043eB4B75d0805c43D7C834902E335621983Cf03",
  chainId: 8453,
  decimals: 18,
  name: "Canadian Dollar",
  symbol: "CADC",
  image: "https://www.svgrepo.com/show/405442/flag-for-flag-canada.svg",
};
export const cNGNToken: Token = {
  address: "0x46C85152bFe9f96829aA94755D9f915F9B10EF5F",
  chainId: 8453,
  decimals: 18,
  name: "Nigerian Naira",
  symbol: "cNGN",
  image: "https://flagsireland.com/cdn/shop/files/NigeriaFlag.png?v=1694521063",
};
export const ZARPToken: Token = {
  address: "0xb755506531786C8aC63B756BaB1ac387bACB0C04",
  chainId: 8453,
  decimals: 18,
  name: "ZA Rand",
  symbol: "ZARP",
  image: "https://cdn.britannica.com/27/4227-004-32423B42/Flag-South-Africa.jpg",
};

export const NZDDToken: Token = {
  address: "0x2dD087589ce9C5b2D1b42e20d2519B3c8cF022b7",
  chainId: 8453,
  decimals: 18,
  name: "NZ Dollar",
  symbol: "NZDD",
  image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Flag_of_New_Zealand.svg/960px-Flag_of_New_Zealand.svg.png",
};


export const BRZToken: Token = {
  address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4",
  chainId: 8453,
  decimals: 18,
  name: "Brazilian Real",
  symbol: "BRZ",
  image: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg",
};

export const LiraToken: Token = {
  address: "0x1A9Be8a692De04bCB7cE5cDDD03afCA97D732c62",
  chainId: 8453,
  decimals: 8,
  name: "Turkish Lira",
  symbol: "TRYB",
  image: "https://www.svgrepo.com/show/242355/turkey.svg",
};

export const MEXPeso: Token = {
  address: "0x269caE7Dc59803e5C596c95756faEeBb6030E0aF",
  chainId: 8453,
  decimals: 6,
  name: "Mexican Peso",
  symbol: "MXNe",
  image: "https://www.svgrepo.com/show/401694/flag-for-mexico.svg",
};

export const stablecoinTokens: Token[] = [
    USDCToken,
    EURCToken,
    CADCToken,
    BRZToken,
    MEXPeso,
    LiraToken
    ,cNGNToken,ZARPToken,NZDDToken
  ];



  export const cryptoTokens: Token[] = [ETHToken, CbBTCToken,USDCToken, VIRTUALToken, AEROToken, AAVEToken,MORPHOToken,WETHToken];