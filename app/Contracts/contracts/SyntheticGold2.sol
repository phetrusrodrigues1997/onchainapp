// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/AggregatorV3Interface.sol";

contract SyntheticGold2 is ERC20 {
    IERC20 public collateralToken;
    AggregatorV3Interface public priceFeed;
    address public owner;

    uint256 public collateralizationRatio = 150; // 150%
    uint256 public lastTrustedPrice;
    uint256 public lastUpdateTime;
    uint256 public TWAP_INTERVAL = 10 minutes;
    uint256 public PRICE_DEVIATION_LIMIT = 5 * 1e6; // 5% (scaled by 1e8)

    // Official USDC address (Ethereum mainnet; adjust for your network)
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    constructor(address _collateral, address _priceFeed)
        ERC20("GoldenEagle Gold", "geGOLD")
    {
        require(_collateral == USDC, "Only official USDC allowed");
        owner = msg.sender;
        collateralToken = IERC20(_collateral);
        priceFeed = AggregatorV3Interface(_priceFeed);

        lastTrustedPrice = getLatestPrice(); // Initialize
        lastUpdateTime = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function mint(uint256 collateralAmount) external {
        // Calculate mint amount
        uint256 goldPrice = getTWAP();
        uint256 mintAmount = (collateralAmount * 1e8) / goldPrice;
        mintAmount = (mintAmount * 100) / collateralizationRatio;

        // Update state before external call (CEI)
        _mint(msg.sender, mintAmount);

        // External call to USDC
        require(
            collateralToken.transferFrom(msg.sender, address(this), collateralAmount),
            "Transfer failed"
        );
    }

    function burn(uint256 sGoldAmount) external {
        require(balanceOf(msg.sender) >= sGoldAmount, "Insufficient balance");

        // Calculate collateral return
        uint256 goldPrice = getTWAP();
        uint256 collateralReturn = (sGoldAmount * goldPrice) / 1e8;
        collateralReturn = (collateralReturn * collateralizationRatio) / 100;

        uint256 fee = (collateralReturn * 20) / 10000; // 0.2%
        uint256 userReceives = collateralReturn - fee;

        // Update state before external calls (CEI)
        _burn(msg.sender, sGoldAmount);

        // External calls to USDC
        require(
            collateralToken.transfer(msg.sender, userReceives),
            "Transfer to user failed"
        );
        require(
            collateralToken.transfer(owner, fee),
            "Transfer fee failed"
        );
    }

    function getLatestPrice() internal view returns (uint256) {
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    function getTWAP() public returns (uint256) {
        uint256 currentPrice = getLatestPrice();

        if (block.timestamp >= lastUpdateTime + TWAP_INTERVAL) {
            uint256 deviation = (currentPrice > lastTrustedPrice)
                ? (currentPrice - lastTrustedPrice) * 1e8 / lastTrustedPrice
                : (lastTrustedPrice - currentPrice) * 1e8 / lastTrustedPrice;

            require(deviation <= PRICE_DEVIATION_LIMIT, "Price deviation too high");

            lastTrustedPrice = currentPrice;
            lastUpdateTime = block.timestamp;
        }

        return lastTrustedPrice;
    }

    // Admin can adjust parameters in emergencies
    function updateTWAPInterval(uint256 interval) external onlyOwner {
        TWAP_INTERVAL = interval;
    }

    function updatePriceDeviationLimit(uint256 limit) external onlyOwner {
        PRICE_DEVIATION_LIMIT = limit;
    }
}