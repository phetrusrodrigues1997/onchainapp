// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract SimpleVault is ERC20, ERC4626 {
    /// @notice Address that collects the performance fees
    address public feeRecipient = 0x1Ac08E56c4d95bD1B8a937C6EB626cFEd9967D67;

    /// @notice Performance fee in basis points (bps). 50 = 0.5%
    uint256 public performanceFeeBps = 50;

    /// @notice Emitted when harvest is called
    event Harvest(address indexed caller);

    constructor(IERC20Metadata underlying)
        ERC20("Simple Vault Token", "sVAULT")
        ERC4626(underlying)
    {}

    /// @dev Resolves decimals conflict between ERC20 and ERC4626
    function decimals()
        public
        view
        virtual
        override(ERC20, ERC4626)
        returns (uint8)
    {
        return ERC4626.decimals();
    }

    /// @notice Stub function to allow future implementation of yield harvesting
    function harvest() external {
        emit Harvest(msg.sender);
        // In a real version: collect rewards, calculate fee, send to feeRecipient
    }
}
