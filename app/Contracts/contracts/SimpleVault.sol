// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ========== Imports ==========
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev Minimal strategy interface
interface ICometUSDCStrategy {
    function deposit() external;
    function withdraw(uint256 amount) external;
    function harvest() external returns (uint256);
}

contract SimpleVault is ERC20, ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    /// @notice The external strategy contract
    ICometUSDCStrategy public strategy;

    /// @param _underlying The USDC token (6 decimals)
    constructor(IERC20Metadata _underlying)
        ERC20("SimpleVault Token", "sVAULT")
        ERC4626(_underlying)
        Ownable(msg.sender)
    {}

    /// @notice Owner can set (or upgrade) the strategy
    function setStrategy(address _strategy) external onlyOwner {
        require(_strategy != address(0), "Invalid strategy address");
        strategy = ICometUSDCStrategy(_strategy);
    }

    /// @notice ERC-20 / ERC-4626 both define decimals(): resolve the conflict
    function decimals()
        public
        view
        override(ERC20, ERC4626)
        returns (uint8)
    {
        return ERC4626.decimals();
    }

    /// @dev Override deposit path: forward assets to strategy after mint
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant {
        require(address(strategy) != address(0), "Strategy not set");

        // Mint shares & pull in assets
        super._deposit(caller, receiver, assets, shares);

        // Forward assets to strategy
        IERC20Metadata(asset()).safeTransfer(address(strategy), assets);
        strategy.deposit();
    }

    /// @dev Override withdraw path: pull assets from strategy then burn shares
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant {
        require(address(strategy) != address(0), "Strategy not set");

        // Pull assets from strategy
        strategy.withdraw(assets);

        // Burn shares and send assets
        super._withdraw(caller, receiver, owner, assets, shares);
    }

    /// @notice Harvest rewards via strategy (vault’s 0.5% fee applies)
    function harvest() external nonReentrant {
        require(address(strategy) != address(0), "Strategy not set");

        uint256 harvested = strategy.harvest();

        // Apply 0.5% performance fee to harvested amount
        uint256 fee = (harvested * 50) / 10_000; // 0.5%
        if (fee > 0) {
            IERC20Metadata(asset()).safeTransfer(owner(), fee);
        }
    }
}
