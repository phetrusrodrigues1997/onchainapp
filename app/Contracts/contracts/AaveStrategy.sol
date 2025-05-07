// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20Metadata}            from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IPoolAddressesProvider}    from "./interfaces/IPoolAddressesProvider.sol";
import {IAavePool}                 from "./interfaces/IAavePool.sol";
import {IAaveIncentivesController} from "./interfaces/IAaveIncentivesController.sol";


contract AaveStrategy {
    IERC20Metadata   public immutable underlying;
    IPoolAddressesProvider public immutable provider;
    IAaveIncentivesController public immutable incentives;
    IERC20Metadata   public immutable rewardToken;
    address          public immutable treasury;
    uint256          public immutable performanceFeeBps;
        // Base Aave V3 addresses (as of early 2024)
    address constant BASE_POOL_ADDRESSES_PROVIDER      = 0x8E5693140eB52d4f8D09B65b9dD2daB6Fe63cDE1;
    address constant BASE_INCENTIVES_CONTROLLER        = 0x929EC64c34a17401F460460D4B9390518E5B473e;
    address constant BASE_AAVE_TOKEN                   = 0xEB466342C4d449BC9f53A865D5Cb90586f405215; // AAVE (Bridged)


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
    incentives = IAaveIncentivesController(BASE_INCENTIVES_CONTROLLER);
    rewardToken = IERC20Metadata(BASE_AAVE_TOKEN);

    underlying.safeApprove(address(pool), type(uint256).max);
}


    /// @notice Deposit all underlying held in this strategy into Aave
    function deposit() external {
        uint256 bal = underlying.balanceOf(address(this));
        if (bal > 0) {
            pool.supply(address(underlying), bal, address(this), 0);
        }
    }

    /// @notice Withdraw `amount` underlying back to this contract
    function withdraw(uint256 amount) external {
        pool.withdraw(address(underlying), amount, address(this));
    }

   function harvest() external returns (uint256 netRewards) {
    address ;
    assets[0] = address(underlying);

    uint256 rewards = incentives.claimRewards(assets, type(uint256).max, address(this));
    if (rewards == 0) return 0;

    uint256 fee = (rewards * performanceFeeBps) / 10_000;
    uint256 keep = rewards - fee;

    rewardToken.safeTransfer(treasury, fee);
    return keep;
}

}
