// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IPoolAddressesProvider} from "./interfaces/IPoolAddressesProvider.sol";
import {IAavePool} from "./interfaces/IAavePool.sol";
import {IAaveIncentivesController} from "./interfaces/IAaveIncentivesController.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AaveStrategy {
    // State variables
    IERC20Metadata public immutable underlying;
    IPoolAddressesProvider public immutable provider;
    IAavePool public immutable pool; // Declared pool
    IAaveIncentivesController public immutable incentives;
    IERC20Metadata public immutable rewardToken;
    address public immutable treasury;
    uint256 public immutable performanceFeeBps;
    address public immutable aToken; // Store aToken address

    // Base Aave V3 addresses
    address constant BASE_POOL_ADDRESSES_PROVIDER = 0x8e5693140EB52D4f8D09B65b9DD2dAB6FE63CDe1; // Corrected checksum
    address constant BASE_INCENTIVES_CONTROLLER = 0x929EC64c34a17401F460460D4B9390518E5B473e;
    address constant BASE_AAVE_TOKEN = 0xEB466342C4d449BC9f53A865D5Cb90586f405215; // AAVE token

    constructor(
        IERC20Metadata _underlying,
        address _treasury,
        uint256 _performanceFeeBps
    ) {
        require(_treasury != address(0), "Treasury address zero");
        require(_performanceFeeBps <= 10000, "Fee too high");

        underlying = _underlying;
        treasury = _treasury;
        performanceFeeBps = _performanceFeeBps;

        provider = IPoolAddressesProvider(BASE_POOL_ADDRESSES_PROVIDER);
        pool = IAavePool(provider.getPool());
        // Get aToken address for the underlying asset
        IAavePool.ReserveData memory reserve = pool.getReserveData(address(underlying));
        aToken = reserve.aTokenAddress;
        incentives = IAaveIncentivesController(BASE_INCENTIVES_CONTROLLER);
        rewardToken = IERC20Metadata(BASE_AAVE_TOKEN);

        // Approve pool to spend underlying tokens
        SafeERC20.safeApprove(underlying, address(pool), type(uint256).max);
    }

    /// @notice Deposit all underlying tokens into Aave
    function deposit() external {
        uint256 bal = underlying.balanceOf(address(this));
        if (bal > 0) {
            pool.supply(address(underlying), bal, address(this), 0);
        }
    }

    /// @notice Withdraw `amount` underlying tokens from Aave
    function withdraw(uint256 amount) external {
        pool.withdraw(address(underlying), amount, address(this));
    }

    /// @notice Harvest rewards from Aave incentives
    function harvest() external returns (uint256 netRewards) {
        address[] memory assets = new address[](1);
        assets[0] = aToken; // Use aToken for incentives

        uint256 rewards = incentives.claimRewards(assets, type(uint256).max, address(this));
        if (rewards == 0) return 0;

        uint256 fee = (rewards * performanceFeeBps) / 10_000;
        uint256 keep = rewards - fee;

        SafeERC20.safeTransfer(rewardToken, treasury, fee);
        return keep;
    }
}