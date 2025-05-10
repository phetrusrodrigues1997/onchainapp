// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MorphoUSDCStrategy is ReentrancyGuard {
    IERC20   public immutable usdc;
    IERC4626 public immutable morphoVault;
    address  public immutable vault;

    modifier onlyVault() {
        require(msg.sender == vault, "only vault");
        _;
    }

    /// @param _vault       The SimpleVault address
    /// @param _morphoVault The Morpho USDC ERC4626 vault address on Base
    constructor(address _vault, address _morphoVault) {
        require(_vault       != address(0), "zero vault");
        require(_morphoVault != address(0), "zero vault");
        vault       = _vault;
        morphoVault = IERC4626(_morphoVault);
        usdc         = IERC20(morphoVault.asset());

        // Approve unlimited USDC to Morpho vault
        usdc.approve(_morphoVault, type(uint256).max);
    }

    function deposit() external onlyVault nonReentrant {
        uint256 bal = usdc.balanceOf(address(this));
        require(bal > 0, "no USDC");
        morphoVault.deposit(bal, address(this));
    }

    function withdraw(uint256 amount) external onlyVault nonReentrant {
        morphoVault.redeem(amount, vault, address(this));
    }

    function harvest() external onlyVault nonReentrant {
        // no-op
    }

    function emergencyWithdrawToken(address token, address to) external onlyVault {
        IERC20(token).transfer(to, IERC20(token).balanceOf(address(this)));
    }
}
