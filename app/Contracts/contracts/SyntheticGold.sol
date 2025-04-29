// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IOracle {
  function getTWAP() external view returns (uint256);
}

contract SyntheticGold is ERC20, Ownable {
  IERC20 public usdc;          // 6 decimals
  IOracle public oracle;       // 8 decimals

  uint256 public totalCollateral;
  uint256 public totalDebt;
  mapping(address => uint256) public userDebt;
  uint256 public minCollateral;

  event Minted(address indexed user, uint256 usdcAmount, uint256 sGoldMinted);
  event Burned(address indexed user, uint256 sGoldAmount, uint256 usdcReturned);
  event PoolFrozen(address indexed user, uint256 attemptedRedemption, uint256 currentCollateral);
  event CollateralToppedUp(uint256 amount);
  event MinCollateralUpdated(uint256 newMinCollateral);

  constructor(address _usdc, address _oracle)
    ERC20("GoldenEagle Gold", "XAUge")
    Ownable(msg.sender) // ✅ Correct way to set the contract owner
{
    usdc = IERC20(_usdc);
    oracle = IOracle(_oracle);
    minCollateral = 0;
}


  function setMinCollateral(uint256 _minCollateral) external onlyOwner {
    minCollateral = _minCollateral;
    emit MinCollateralUpdated(_minCollateral);
  }

  function mint(uint256 usdcAmount) external {
    require(usdcAmount > 0, "Zero collateral");
    require(usdc.transferFrom(msg.sender, address(this), usdcAmount), "USDC transfer failed");

    uint256 price      = oracle.getTWAP();
    uint256 sGoldAmount = (usdcAmount * 1e18) / price;
    require(sGoldAmount > 0, "Amount too small");

    userDebt[msg.sender] += sGoldAmount;
    totalDebt           += sGoldAmount;
    totalCollateral     += usdcAmount;

    _mint(msg.sender, sGoldAmount);
    emit Minted(msg.sender, usdcAmount, sGoldAmount);
  }

  function burn(uint256 sGoldAmount) external {
    require(sGoldAmount > 0, "Zero amount");
    require(balanceOf(msg.sender) >= sGoldAmount, "Insufficient geGOLD");

    uint256 price       = oracle.getTWAP();
    uint256 usdcToReturn = (sGoldAmount * price) / 1e18;
    require(usdcToReturn > 0, "Redeem amount too small");

    if (totalCollateral < usdcToReturn + minCollateral) {
      emit PoolFrozen(msg.sender, usdcToReturn, totalCollateral);
      revert("Collateral pool below minimum");
    }

    _burn(msg.sender, sGoldAmount);
    userDebt[msg.sender]  -= sGoldAmount;
    totalDebt            -= sGoldAmount;
    totalCollateral      -= usdcToReturn;

    require(usdc.transfer(msg.sender, usdcToReturn), "USDC transfer failed");
    emit Burned(msg.sender, sGoldAmount, usdcToReturn);
  }

  /// @notice Simple two-field view
  function getPoolStatus() external view returns (uint256 collateral, uint256 debt) {
    return (totalCollateral, totalDebt);
  }

  /// @notice Full snapshot in a single call
  function getPoolDetails() external view 
    returns (
      uint256 price,
      uint256 collateral,
      uint256 debt
    )
  {
    price      = oracle.getTWAP();
    collateral = totalCollateral;
    debt       = totalDebt;
  }

  /// @notice Expose the min-collateral floor
  function getMinCollateral() external view returns (uint256) {
    return minCollateral;
  }

  /// @notice Pool collateralization ratio: (collateral×price)/debt, scaled to 18 decimals
  function collateralizationRatio() external view returns (uint256) {
    if (totalDebt == 0) return type(uint256).max;
    // collateral(6) + price(8) → scale by 1e4 to reach 18
    return (totalCollateral * oracle.getTWAP() * 1e4) / totalDebt;
  }

  /// @notice Allow owner to top up the pool
  function ownerDeposit(uint256 amount) external onlyOwner {
    require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    totalCollateral += amount;
    emit CollateralToppedUp(amount);
  }
}
