pragma solidity ^0.8.19;

// SPDX-License-Identifier: MIT

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract USDCLendingPool {
    // --- Events ---
    event Supplied(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 principal, uint256 interest);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event InterestClaimed(address indexed user, uint256 amount);
    event Liquidated(
        address indexed liquidator,
        address indexed borrower,
        uint256 debtAmount,
        uint256 collateralSeizedAmount,
        uint256 interestAddedToPool
    );
    event NewOwner(address indexed oldOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);
    event RatesUpdated(uint256 baseRateBps, uint256 multiplierBps);
    event ReserveFactorUpdated(uint256 reserveFactorBps);
    event LTVUpdated(uint256 loanToValueRatioBps);
    event LiquidationThresholdUpdated(uint256 liquidationThresholdBps);
    event ReservesWithdrawn(address indexed to, uint256 amount);

    // --- State Variables ---
    IERC20 public immutable usdcToken;
    address public owner;
    bool public paused;
    address public immutable reserveWithdrawalAddress;

    uint256 public totalSupplied;
    uint256 public totalBorrowed;
    uint256 public totalReserves;

    mapping(address => uint256) public suppliedBalances;
    mapping(address => uint256) public suppliedInterestBalances;
    mapping(address => uint256) public supplyStartTimestamp;
    mapping(address => uint256) public borrowedPrincipals;
    mapping(address => uint256) public borrowStartTimestamp;
    mapping(address => uint256) public borrowMaturityTimestamp;

    address[] public borrowers;
    mapping(address => uint256) public borrowerIndex;
    address[] public suppliers;
    mapping(address => uint256) public supplierIndex;

    uint256 public baseRateBps;
    uint256 public multiplierBps;
    uint256 public reserveFactorBps;
    uint256 public loanToValueRatioBps;
    uint256 public liquidationThresholdBps;

    uint256 private constant BPS_DIVISOR = 10000;
    uint256 private constant SECONDS_IN_YEAR = 365 days;
    uint256 private constant LOAN_DURATION = 30 minutes;
    uint256 private constant MIN_RESERVE_THRESHOLD = 15_000;
    uint256 private constant MAX_LIQUIDATIONS_PER_TX = 10;

    bool private locked;

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    // --- Constructor ---
    constructor(address _usdcTokenAddress, address _reserveWithdrawalAddress) {
        require(_usdcTokenAddress != address(0), "Invalid USDC token address");
        require(_reserveWithdrawalAddress != address(0), "Invalid reserve withdrawal address");
        usdcToken = IERC20(_usdcTokenAddress);
        owner = msg.sender;
        reserveWithdrawalAddress = _reserveWithdrawalAddress;

        baseRateBps = 100; // Changed from 200 (2% to 1%)
    multiplierBps = 1000; // Changed from 2000 (20% to 10%)
        reserveFactorBps = 1; //
        loanToValueRatioBps = 7000;
        liquidationThresholdBps = 8000;

        emit NewOwner(address(0), msg.sender);
    }

    // --- Core Logic Functions ---

    function supply(uint256 _amount) external whenNotPaused nonReentrant {
        require(_amount > 0, "Amount must be > 0");

        _updateUserBorrowInterest(msg.sender);
        _updateUserSupplyInterest(msg.sender);
        _liquidateIfEligible(msg.sender);
        liquidateAllEligible();

        usdcToken.transferFrom(msg.sender, address(this), _amount);

        if (suppliedBalances[msg.sender] == 0 && _amount > 0) {
            suppliers.push(msg.sender);
            supplierIndex[msg.sender] = suppliers.length;
        }

        suppliedBalances[msg.sender] += _amount;
        totalSupplied += _amount;
        supplyStartTimestamp[msg.sender] = block.timestamp;

        emit Supplied(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external whenNotPaused nonReentrant {
        require(_amount > 0, "Amount must be > 0");

        _updateUserBorrowInterest(msg.sender);
        _updateUserSupplyInterest(msg.sender);
        _liquidateIfEligible(msg.sender);
        liquidateAllEligible();

        uint256 userSupply = suppliedBalances[msg.sender];
        require(userSupply >= _amount, "Insufficient supplied balance");

        require(borrowedPrincipals[msg.sender] == 0, "Cannot withdraw while loan is active");

        suppliedBalances[msg.sender] -= _amount;
        totalSupplied -= _amount;

        if (suppliedBalances[msg.sender] == 0 && supplierIndex[msg.sender] > 0) {
            uint256 index = supplierIndex[msg.sender] - 1;
            if (index < suppliers.length - 1) {
                address lastSupplier = suppliers[suppliers.length - 1];
                suppliers[index] = lastSupplier;
                supplierIndex[lastSupplier] = index + 1;
            }
            suppliers.pop();
            supplierIndex[msg.sender] = 0;
        }

        uint256 interestToTransfer = 0;
        if (_amount == userSupply && suppliedInterestBalances[msg.sender] > 0) {
            interestToTransfer = suppliedInterestBalances[msg.sender];
            suppliedInterestBalances[msg.sender] = 0;
        }

        usdcToken.transfer(msg.sender, _amount + interestToTransfer);

        emit Withdrawn(msg.sender, _amount, interestToTransfer);
    }

    function borrow(uint256 _amount) external whenNotPaused nonReentrant {
        require(_amount > 0, "Amount must be > 0");

        _updateUserBorrowInterest(msg.sender);
        _updateUserSupplyInterest(msg.sender);
        _liquidateIfEligible(msg.sender);
        liquidateAllEligible();

        uint256 userBorrowedWithInterest = getBorrowedBalanceWithInterest(msg.sender);
        uint256 newTotalUserBorrow = userBorrowedWithInterest + _amount;

        uint256 borrowLimit = (suppliedBalances[msg.sender] * loanToValueRatioBps) / BPS_DIVISOR;
        require(newTotalUserBorrow <= borrowLimit, "Borrow amount exceeds LTV limit");

        uint256 availableToBorrow = usdcToken.balanceOf(address(this)) - totalReserves;
        require(_amount <= availableToBorrow, "Insufficient liquidity in pool");

        uint256 newMaturityTimestamp = block.timestamp + LOAN_DURATION;

        if (borrowedPrincipals[msg.sender] > 0) {
            uint256 accruedInterest = _calculateAccruedInterest(msg.sender);
            borrowedPrincipals[msg.sender] += accruedInterest;
            totalBorrowed += accruedInterest;

            if (borrowerIndex[msg.sender] > 0) {
                uint256 index = borrowerIndex[msg.sender] - 1;
                if (index < borrowers.length - 1) {
                    address lastBorrower = borrowers[borrowers.length - 1];
                    borrowers[index] = lastBorrower;
                    borrowerIndex[lastBorrower] = index + 1;
                }
                borrowers.pop();
                borrowerIndex[msg.sender] = 0;
            }
        }

        borrowedPrincipals[msg.sender] += _amount;
        borrowStartTimestamp[msg.sender] = block.timestamp;
        borrowMaturityTimestamp[msg.sender] = newMaturityTimestamp;
        totalBorrowed += _amount;

        _insertBorrowerSorted(msg.sender, newMaturityTimestamp);

        usdcToken.transfer(msg.sender, _amount);
        
        emit Borrowed(msg.sender, _amount);
    }

    function repayBorrow(uint256 _amount) external whenNotPaused nonReentrant {
        require(_amount > 0, "Amount must be > 0");

        _updateUserBorrowInterest(msg.sender);
        _updateUserSupplyInterest(msg.sender);
        _liquidateIfEligible(msg.sender);
        liquidateAllEligible();

        uint256 userBorrowedWithInterest = getBorrowedBalanceWithInterest(msg.sender);
        require(userBorrowedWithInterest > 0, "No debt to repay");

        uint256 amountToRepay = _amount > userBorrowedWithInterest ? userBorrowedWithInterest : _amount;
        uint256 principalPortion;
        uint256 interestPortion;

        uint256 originalPrincipal = borrowedPrincipals[msg.sender];

        if (originalPrincipal >= amountToRepay) {
            principalPortion = amountToRepay;
            interestPortion = 0;
        } else {
            principalPortion = originalPrincipal;
            interestPortion = amountToRepay - principalPortion;
        }

        usdcToken.transferFrom(msg.sender, address(this), amountToRepay);

        borrowedPrincipals[msg.sender] -= principalPortion;
        totalBorrowed -= amountToRepay;

        if (borrowedPrincipals[msg.sender] == 0 && getBorrowedBalanceWithInterest(msg.sender) == 0) {
            borrowStartTimestamp[msg.sender] = 0;
            borrowMaturityTimestamp[msg.sender] = 0;
            if (borrowerIndex[msg.sender] > 0) {
                uint256 index = borrowerIndex[msg.sender] - 1;
                if (index < borrowers.length - 1) {
                    address lastBorrower = borrowers[borrowers.length - 1];
                    borrowers[index] = lastBorrower;
                    borrowerIndex[lastBorrower] = index + 1;
                }
                borrowers.pop();
                borrowerIndex[msg.sender] = 0;
            }
        }

        emit Repaid(msg.sender, amountToRepay);
    }

    function claimInterest() external whenNotPaused nonReentrant {
        _updateUserBorrowInterest(msg.sender);
        _updateUserSupplyInterest(msg.sender);
        _liquidateIfEligible(msg.sender);
        liquidateAllEligible();

        uint256 interest = suppliedInterestBalances[msg.sender];
        require(interest > 0, "No interest to claim");

        suppliedInterestBalances[msg.sender] = 0;
        usdcToken.transfer(msg.sender, interest);

        emit InterestClaimed(msg.sender, interest);
    }

    function liquidate(address _borrower) external whenNotPaused nonReentrant onlyOwner {
        _updateUserBorrowInterest(_borrower);
        _updateUserSupplyInterest(_borrower);
        _liquidateIfEligible(_borrower);
    }

    function liquidateAllEligible() internal {
        uint256 usersProcessed = 0;
        uint256 i = 0;

        while (i < borrowers.length && usersProcessed < MAX_LIQUIDATIONS_PER_TX) {
            address borrower = borrowers[i];
            if (borrowerIndex[borrower] > 0) {
                _updateUserBorrowInterest(borrower);
                _updateUserSupplyInterest(borrower);
                _liquidateIfEligible(borrower);
                if (borrowerIndex[borrower] == 0) {
                    continue;
                }
            }
            i++;
            usersProcessed++;
        }
    }

    // --- Internal Helper Functions ---

    function _insertBorrowerSorted(address _borrower, uint256 _maturityTimestamp) internal {
        if (borrowers.length == 0) {
            borrowers.push(_borrower);
            borrowerIndex[_borrower] = 1;
            return;
        }

        uint256 insertPos = borrowers.length;
        for (uint256 i = 0; i < borrowers.length; i++) {
            if (borrowMaturityTimestamp[borrowers[i]] > _maturityTimestamp) {
                insertPos = i;
                break;
            }
        }

        borrowers.push(address(0));
        for (uint256 i = borrowers.length - 1; i > insertPos; i--) {
            borrowers[i] = borrowers[i - 1];
            borrowerIndex[borrowers[i]] = i + 1;
        }
        borrowers[insertPos] = _borrower;
        borrowerIndex[_borrower] = insertPos + 1;
    }

    function _liquidateIfEligible(address _user) internal {
        if (borrowedPrincipals[_user] == 0 || suppliedBalances[_user] == 0) {
            return;
        }

        uint256 borrowerDebt = getBorrowedBalanceWithInterest(_user);
        uint256 borrowerSupplyWithInterest = getSuppliedBalanceWithInterest(_user);

        if (
            borrowerDebt > borrowerSupplyWithInterest ||
            block.timestamp > borrowMaturityTimestamp[_user]
        ) {
            uint256 accruedInterest = _calculateAccruedInterest(_user);
            uint256 principalDebt = borrowedPrincipals[_user];
            uint256 netCollateral = suppliedBalances[_user] > principalDebt
                ? suppliedBalances[_user] - principalDebt
                : 0;
            uint256 contractBalance = usdcToken.balanceOf(address(this));

            // Cap interest at available collateral
            uint256 totalInterest = netCollateral > accruedInterest ? accruedInterest : netCollateral;
            uint256 interestToPool = (totalInterest * (BPS_DIVISOR - reserveFactorBps)) / BPS_DIVISOR;
            uint256 reserveShare = totalInterest - interestToPool;

            // Remaining collateral to reserve
            uint256 collateralToReserve = netCollateral > totalInterest ? netCollateral - totalInterest : 0;
            uint256 actualCollateralToReserve = collateralToReserve > contractBalance ? contractBalance : collateralToReserve;

            // Update reserves and transfer collateral
            totalReserves += reserveShare;
            if (actualCollateralToReserve > 0) {
                usdcToken.transfer(reserveWithdrawalAddress, actualCollateralToReserve);
            }

            // Clear borrower's balances
            borrowedPrincipals[_user] = 0;
            borrowStartTimestamp[_user] = 0;
            borrowMaturityTimestamp[_user] = 0;
            totalBorrowed -= borrowerDebt;
            totalSupplied -= suppliedBalances[_user];
            suppliedBalances[_user] = 0;
            suppliedInterestBalances[_user] = 0;

            // Remove from lists
            _removeFromLists(_user);

            emit Liquidated(msg.sender, _user, borrowerDebt, actualCollateralToReserve, interestToPool);
        }
    }

    function _removeFromLists(address _user) internal {
        // Remove from borrowers list
        if (borrowerIndex[_user] > 0) {
            uint256 index = borrowerIndex[_user] - 1;
            if (index < borrowers.length - 1) {
                address lastBorrower = borrowers[borrowers.length - 1];
                borrowers[index] = lastBorrower;
                borrowerIndex[lastBorrower] = index + 1;
            }
            borrowers.pop();
            borrowerIndex[_user] = 0;
        }

        // Remove from suppliers list
        if (supplierIndex[_user] > 0) {
            uint256 index = supplierIndex[_user] - 1;
            if (index < suppliers.length - 1) {
                address lastSupplier = suppliers[suppliers.length - 1];
                suppliers[index] = lastSupplier;
                supplierIndex[lastSupplier] = index + 1;
            }
            suppliers.pop();
            supplierIndex[_user] = 0;
        }
    }

    function _updateUserBorrowInterest(address _user) internal {
        if (borrowedPrincipals[_user] > 0 && borrowStartTimestamp[_user] > 0 && borrowStartTimestamp[_user] < block.timestamp) {
            uint256 accruedInterest = _calculateAccruedInterest(_user);
            if (accruedInterest > 0) {
                borrowedPrincipals[_user] += accruedInterest;
                totalBorrowed += accruedInterest;
                uint256 reserveShare = (accruedInterest * reserveFactorBps) / BPS_DIVISOR;
                totalReserves += reserveShare;
            }
        }
        _autoWithdrawReserves();
    }

    function _updateUserSupplyInterest(address _user) internal {
        if (suppliedBalances[_user] > 0 && supplyStartTimestamp[_user] > 0 && supplyStartTimestamp[_user] < block.timestamp) {
            uint256 accruedInterest = _calculateAccruedSupplyInterest(_user);
            if (accruedInterest > 0) {
                suppliedInterestBalances[_user] += accruedInterest;
                supplyStartTimestamp[_user] = block.timestamp;
            }
        }
    }

    function _calculateAccruedInterest(address _user) internal view returns (uint256) {
        if (borrowedPrincipals[_user] == 0 || borrowStartTimestamp[_user] == 0 || borrowStartTimestamp[_user] >= block.timestamp) {
            return 0;
        }
        uint256 timeDelta = block.timestamp - borrowStartTimestamp[_user];
        uint256 currentBorrowRateBps = getCurrentBorrowRateBps();
        uint256 interest = (borrowedPrincipals[_user] * currentBorrowRateBps * timeDelta) / (BPS_DIVISOR * SECONDS_IN_YEAR);
        return interest;
    }

    function _calculateAccruedSupplyInterest(address _user) internal view returns (uint256) {
        if (suppliedBalances[_user] == 0 || supplyStartTimestamp[_user] == 0 || supplyStartTimestamp[_user] >= block.timestamp) {
            return 0;
        }
        uint256 timeDelta = block.timestamp - supplyStartTimestamp[_user];
        uint256 currentSupplyRateBps = getCurrentSupplyRateBps();
        uint256 interest = (suppliedBalances[_user] * currentSupplyRateBps * timeDelta) / (BPS_DIVISOR * SECONDS_IN_YEAR);
        return interest;
    }

    function _autoWithdrawReserves() internal {
        if (totalReserves >= MIN_RESERVE_THRESHOLD) {
            uint256 amount = totalReserves;
            totalReserves = 0;
            usdcToken.transfer(reserveWithdrawalAddress, amount);
            emit ReservesWithdrawn(reserveWithdrawalAddress, amount);
        }
    }

    // --- View Functions ---

    function getBorrowedBalanceWithInterest(address _user) public view returns (uint256) {
        if (borrowedPrincipals[_user] == 0) {
            return 0;
        }
        uint256 accruedInterest = _calculateAccruedInterest(_user);
        return borrowedPrincipals[_user] + accruedInterest;
    }

    function getSuppliedBalanceWithInterest(address _user) public view returns (uint256) {
        if (suppliedBalances[_user] == 0) {
            return 0;
        }
        uint256 accruedInterest = _calculateAccruedSupplyInterest(_user);
        return suppliedBalances[_user] + suppliedInterestBalances[_user] + accruedInterest;
    }

    function getUtilizationRateBps() public view returns (uint256) {
        if (totalSupplied == 0) {
            return 0;
        }
        if (totalBorrowed >= totalSupplied) return BPS_DIVISOR;
        return (totalBorrowed * BPS_DIVISOR) / totalSupplied;
    }

    function getCurrentBorrowRateBps() public view returns (uint256) {
        uint256 utilization = getUtilizationRateBps();
        return baseRateBps + (utilization * multiplierBps) / BPS_DIVISOR;
    }

    function getCurrentSupplyRateBps() public view returns (uint256) {
        if (totalSupplied == 0) return 0;
        uint256 borrowRate = getCurrentBorrowRateBps();
        uint256 utilization = getUtilizationRateBps();
        uint256 grossSupplyRate = (borrowRate * utilization) / BPS_DIVISOR;
        return (grossSupplyRate * (BPS_DIVISOR - reserveFactorBps)) / BPS_DIVISOR;
    }

    function getBorrowLimit(address _user) public view returns (uint256) {
        return (suppliedBalances[_user] * loanToValueRatioBps) / BPS_DIVISOR;
    }

    function getAccountHealthFactor(address _user) public view returns (uint256) {
        uint256 userSupply = suppliedBalances[_user];
        uint256 userDebt = getBorrowedBalanceWithInterest(_user);
        if (userDebt == 0) {
            return type(uint256).max;
        }
        if (userSupply == 0) {
            return 0;
        }
        uint256 maxDebtBeforeLiquidation = (userSupply * liquidationThresholdBps) / BPS_DIVISOR;
        return (maxDebtBeforeLiquidation * BPS_DIVISOR) / userDebt;
    }

    // --- Admin Functions ---

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        emit NewOwner(owner, _newOwner);
        owner = _newOwner;
    }

    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function setRates(uint256 _baseRateBps, uint256 _multiplierBps) external onlyOwner {
        baseRateBps = _baseRateBps;
        multiplierBps = _multiplierBps;
        emit RatesUpdated(_baseRateBps, _multiplierBps);
    }

    function setReserveFactor(uint256 _reserveFactorBps) external onlyOwner {
        require(_reserveFactorBps <= BPS_DIVISOR, "Reserve factor too high");
        reserveFactorBps = _reserveFactorBps;
        emit ReserveFactorUpdated(_reserveFactorBps);
    }

    function setLoanToValueRatio(uint256 _loanToValueRatioBps) external onlyOwner {
        require(_loanToValueRatioBps <= BPS_DIVISOR, "LTV too high");
        require(_loanToValueRatioBps < liquidationThresholdBps, "LTV must be < liquidation threshold");
        loanToValueRatioBps = _loanToValueRatioBps;
        emit LTVUpdated(_loanToValueRatioBps);
    }

    function setLiquidationThreshold(uint256 _liquidationThresholdBps) external onlyOwner {
        require(_liquidationThresholdBps <= BPS_DIVISOR, "Liquidation threshold too high");
        require(loanToValueRatioBps < _liquidationThresholdBps, "Liquidation threshold must be > LTV");
        liquidationThresholdBps = _liquidationThresholdBps;
        emit LiquidationThresholdUpdated(_liquidationThresholdBps);
    }

    function withdrawReserves(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Invalid recipient");
        require(totalReserves >= _amount, "Insufficient reserves");
        totalReserves -= _amount;
        usdcToken.transfer(_to, _amount);
        emit ReservesWithdrawn(_to, _amount);
    }

    // --- View Functions for Borrowers and Suppliers Lists ---
    function getBorrowersCount() external view returns (uint256) {
        return borrowers.length;
    }

    function getBorrowerAtIndex(uint256 index) external view returns (address) {
        require(index < borrowers.length, "Index out of bounds");
        return borrowers[index];
    }

    function getSuppliersCount() external view returns (uint256) {
        return suppliers.length;
    }

    function getSupplierAtIndex(uint256 index) external view returns (address) {
        require(index < suppliers.length, "Index out of bounds");
        return suppliers[index];
    }
}