// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// OpenZeppelin utilities
import {IERC20}    from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

/// @notice Minimal Comet interface for cUSDCv3
interface IComet {
    function supply(address asset, uint256 amount, address onBehalf) external;
    function withdraw(address asset, uint256 amount, address to) external;
    function accrueAccount(address account) external;
    function isSupplyPaused() external view returns (bool);
}

/// @notice Minimal interface to claim COMP rewards for a Comet market
interface ICometRewards {
    function claim(
        address comet,
        address src,
        address to,
        bool shouldAccrue
    ) external returns (uint256);
}

/// @title Compound V3 USDC Strategy for SimpleVault on Base
contract CometUSDCStrategy {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;     // USDC (6 decimals) on Base
    IComet public immutable comet;     // cUSDCv3 market proxy
    ICometRewards public immutable rewards; // rewards distributor
    IERC20 public immutable comp;     // COMP token on Base
    address public immutable vault;   // only this address may withdraw

    constructor(address _vault) {
        require(_vault != address(0), "zero vault");
        vault = _vault;

        // Hard-coded Base addresses
        usdc    = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
        comet   = IComet(0xA238Dd80C259a72e81d7e4664a9801593F98d1c5);
        rewards = ICometRewards(0xf9cc4F0D883F1a1eb2c253bdb46c254Ca51E1F44);
        comp    = IERC20(0x9e1028F5F1D5eDE59748FFceE5532509976840E0);

        // Use plain approve for USDC
        console.log("Approving Comet to spend USDC...");
        require(usdc.approve(address(comet), type(uint256).max), "approve failed");
        console.log("Approval successful");
    }

    /// @notice Deposit all USDC held here into the Comet market
    function deposit() external {
        console.log("Starting strategy deposit...");
        uint256 bal = usdc.balanceOf(address(this));
        console.log("Strategy USDC balance:", bal);
        if (bal > 0) {
            console.log("Calling Comet.supply...");
            console.log("Asset:", address(usdc));
            console.log("Amount:", bal);
            console.log("OnBehalf:", address(this));
            comet.supply(address(usdc), bal, address(this));
            console.log("Comet supply completed");
        } else {
            console.log("No USDC to deposit");
            revert("No USDC balance");
        }
    }

    /// @notice Withdraw exactly `amount` USDC back to the vault
    function withdraw(uint256 amount) external {
        console.log("Starting withdraw, amount:", amount);
        require(msg.sender == vault, "only vault");
        comet.withdraw(address(usdc), amount, vault);
        console.log("Withdraw completed");
    }

    /// @notice Claim COMP rewards and forward to vault (vault takes its 0.5% fee)
    function harvest() external returns (uint256 totalComp) {
        console.log("Starting harvest...");
        // Sync rewards
        comet.accrueAccount(address(this));

        // Claim all COMP here
        console.log("Claiming COMP rewards...");
        totalComp = rewards.claim(address(comet), address(this), address(this), false);
        console.log("Claimed COMP:", totalComp);
        if (totalComp > 0) {
            // Forward to vault; vault's ERC4626 logic will take the fee in COMP
            console.log("Transferring COMP to vault...");
            comp.safeTransfer(vault, totalComp);
            console.log("COMP transfer completed");
        }
    }
}