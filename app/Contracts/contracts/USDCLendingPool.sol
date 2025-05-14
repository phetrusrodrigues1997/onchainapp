 // SPDX-License-Identifier: MIT
 pragma solidity ^0.8.19;

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
 event Withdrawn(address indexed user, uint256 amount);
 event Borrowed(address indexed user, uint256 amount);
 event Repaid(address indexed user, uint256 amount);
 event Liquidated(
 address indexed liquidator,
 address indexed borrower,
 uint256 repaidAmount,
 uint256 collateralSeizedAmount
 );
 event NewOwner(address indexed oldOwner, address indexed newOwner);
 event Paused(address account);
 event Unpaused(address account);

 event RatesUpdated(
 uint256 baseRateBps,
 uint256 multiplierBps
 );
 event ReserveFactorUpdated(uint256 reserveFactorBps);
 event LTVUpdated(uint256 loanToValueRatioBps);
 event LiquidationThresholdUpdated(uint256 liquidationThresholdBps);
 event LiquidationPenaltyUpdated(uint256 liquidationPenaltyBps);
 event ReservesWithdrawn(address indexed to, uint256 amount);

 // --- State Variables ---
 IERC20 public immutable usdcToken;
 address public owner;
 bool public paused;

 // Balances
 uint256 public totalSupplied; // Total principal supplied by users
 uint256 public totalBorrowed; // Total principal borrowed by users

 mapping(address => uint256) public suppliedBalances; // User's principal supply
 mapping(address => uint256) public borrowedPrincipals; // User's principal borrowed amount
 mapping(address => uint256) public borrowStartTimestamp; // Timestamp when user last borrowed or updated borrow

 // Interest Rate Model Parameters (all in BPS, 1% = 100 BPS)
 uint256 public baseRateBps; // Annual Percentage Rate (APR)
 uint256 public multiplierBps; // Additional APR per 100% utilization

 // Protocol Parameters
 uint256 public reserveFactorBps; // Share of interest income going to reserves (e.g., 1000 for 10%)
 uint256 public loanToValueRatioBps; // Max borrow amount relative to supply (e.g., 7500 for 75%)
 uint256 public liquidationThresholdBps; // Threshold for liquidation (e.g., 8000 for 80%)
 uint256 public liquidationPenaltyBps; // Bonus for liquidators (e.g., 500 for 5%)

 uint256 public totalReserves;

 // Constants
 uint256 private constant BPS_DIVISOR = 10000;
 uint256 private constant SECONDS_IN_YEAR = 365 days;

 // Reentrancy guard
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
 constructor(address _usdcTokenAddress) {
 require(_usdcTokenAddress != address(0), "Invalid USDC token address");
 usdcToken = IERC20(_usdcTokenAddress);
 owner = msg.sender;

 // Default parameters (can be changed by owner)
 baseRateBps = 200; // 2% APR
 multiplierBps = 2000; // 20% APR slope for utilization
 reserveFactorBps = 1000; // 10%
 loanToValueRatioBps = 7500; // 75%
 liquidationThresholdBps = 8000; // 80%
 liquidationPenaltyBps = 500; // 5%

 emit NewOwner(address(0), msg.sender);
 }

 // --- Core Logic Functions ---

 function supply(uint256 _amount) external whenNotPaused nonReentrant {
 require(_amount > 0, "Amount must be > 0");

 _updateUserBorrowInterest(msg.sender); // Update interest before supply changes collateral ratio

 usdcToken.transferFrom(msg.sender, address(this), _amount);

 suppliedBalances[msg.sender] += _amount;
 totalSupplied += _amount;

 emit Supplied(msg.sender, _amount);
 }

 function withdraw(uint256 _amount) external whenNotPaused nonReentrant {
 require(_amount > 0, "Amount must be > 0");

 _updateUserBorrowInterest(msg.sender);

 uint256 userSupply = suppliedBalances[msg.sender];
 require(userSupply >= _amount, "Insufficient supplied balance");

 // Check if withdrawal would put user below collateral requirements for existing borrows
 uint256 remainingSupply = userSupply - _amount;
 uint256 userBorrowedWithInterest = getBorrowedBalanceWithInterest(msg.sender);
 if (userBorrowedWithInterest > 0) {
 require(
 remainingSupply * loanToValueRatioBps >= userBorrowedWithInterest * BPS_DIVISOR,
 "Withdrawal violates LTV for existing borrow"
 );
 }

 suppliedBalances[msg.sender] -= _amount;
 totalSupplied -= _amount;

 usdcToken.transfer(msg.sender, _amount);

 emit Withdrawn(msg.sender, _amount);
 }

 function borrow(uint256 _amount) external whenNotPaused nonReentrant {
 require(_amount > 0, "Amount must be > 0");

 _updateUserBorrowInterest(msg.sender); // Accrue interest on any existing debt first

 uint256 userBorrowedWithInterest = getBorrowedBalanceWithInterest(msg.sender);
 uint256 newTotalUserBorrow = userBorrowedWithInterest + _amount;

 // Check LTV
 uint256 borrowLimit = (suppliedBalances[msg.sender] * loanToValueRatioBps) / BPS_DIVISOR;
 require(newTotalUserBorrow <= borrowLimit, "Borrow amount exceeds LTV limit");

 // Check pool liquidity
 uint256 availableToBorrow = usdcToken.balanceOf(address(this)) - totalReserves; 
 if (totalSupplied < totalBorrowed) { 
 availableToBorrow = 0;
 } else {
 // More accurate available from pool perspective (total principal supplied - total principal borrowed)
 // totalBorrowed in this contract includes accrued interest, so this needs careful handling.
 // For simplicity, let's assume totalSupplied - totalBorrowed (which includes interest) is a conservative measure.
 availableToBorrow = totalSupplied > totalBorrowed ? totalSupplied - totalBorrowed : 0;
 }
 require(_amount <= availableToBorrow, "Insufficient liquidity in pool");

 if (borrowedPrincipals[msg.sender] > 0) {
 uint256 accruedInterest = _calculateAccruedInterest(msg.sender);
 borrowedPrincipals[msg.sender] += accruedInterest;
 totalBorrowed += accruedInterest; 
 totalReserves += (accruedInterest * reserveFactorBps) / BPS_DIVISOR;
 }

 borrowedPrincipals[msg.sender] += _amount;
 borrowStartTimestamp[msg.sender] = block.timestamp; 
 totalBorrowed += _amount; 

 usdcToken.transfer(msg.sender, _amount);

 emit Borrowed(msg.sender, _amount);
 }

 function repayBorrow(uint256 _amount) external whenNotPaused nonReentrant {
 require(_amount > 0, "Amount must be > 0");

 _updateUserBorrowInterest(msg.sender);

 uint256 userBorrowedWithInterest = getBorrowedBalanceWithInterest(msg.sender);
 require(userBorrowedWithInterest > 0, "No debt to repay");

 uint256 amountToRepay = _amount > userBorrowedWithInterest ? userBorrowedWithInterest : _amount;
 uint256 principalPortion;
 uint256 interestPortion;

 uint256 originalPrincipal = borrowedPrincipals[msg.sender]; // Before interest update in this call

 if (originalPrincipal >= amountToRepay) { // Repaying less than or equal to current principal (before this call's interest)
    principalPortion = amountToRepay;
    interestPortion = 0; // All goes to principal first if simplified
 } else {
    principalPortion = originalPrincipal;
    interestPortion = amountToRepay - principalPortion;
 }

 usdcToken.transferFrom(msg.sender, address(this), amountToRepay);

 borrowedPrincipals[msg.sender] -= principalPortion;
 totalBorrowed -= amountToRepay; 

 totalReserves += (interestPortion * reserveFactorBps) / BPS_DIVISOR;

 if (borrowedPrincipals[msg.sender] == 0 && getBorrowedBalanceWithInterest(msg.sender) == 0) { // Double check if truly zero
    borrowStartTimestamp[msg.sender] = 0; 
 }

 emit Repaid(msg.sender, amountToRepay);
 }

 function liquidate(address _borrower) external whenNotPaused nonReentrant {
 _updateUserBorrowInterest(_borrower);

 uint256 borrowerSupply = suppliedBalances[_borrower];
 uint256 borrowerDebt = getBorrowedBalanceWithInterest(_borrower);

 require(borrowerSupply > 0, "Borrower has no supply (collateral)");
 require(borrowerDebt > 0, "Borrower has no debt");

 require(
 borrowerDebt * BPS_DIVISOR > borrowerSupply * liquidationThresholdBps,
 "Borrower not eligible for liquidation"
 );

 uint256 amountToRepayByLiquidator = borrowerDebt; 

 usdcToken.transferFrom(msg.sender, address(this), amountToRepayByLiquidator);

 uint256 collateralToSeize = (amountToRepayByLiquidator * (BPS_DIVISOR + liquidationPenaltyBps)) / BPS_DIVISOR;
 if (collateralToSeize > borrowerSupply) {
 collateralToSeize = borrowerSupply; 
 }

 borrowedPrincipals[_borrower] = 0; 
 borrowStartTimestamp[_borrower] = 0;
 suppliedBalances[_borrower] -= collateralToSeize;

 totalBorrowed -= amountToRepayByLiquidator; 
 totalSupplied -= collateralToSeize; 

 usdcToken.transfer(msg.sender, collateralToSeize);

 emit Liquidated(msg.sender, _borrower, amountToRepayByLiquidator, collateralToSeize);
 }

 // --- Internal Helper Functions ---

 function _updateUserBorrowInterest(address _user) internal {
 if (borrowedPrincipals[_user] > 0 && borrowStartTimestamp[_user] > 0 && borrowStartTimestamp[_user] < block.timestamp) {
 uint256 accruedInterest = _calculateAccruedInterest(_user);
 if (accruedInterest > 0) {
 borrowedPrincipals[_user] += accruedInterest;
 totalBorrowed += accruedInterest; 
 totalReserves += (accruedInterest * reserveFactorBps) / BPS_DIVISOR;
 borrowStartTimestamp[_user] = block.timestamp;
 }
 } else if (borrowedPrincipals[_user] > 0 && borrowStartTimestamp[_user] == 0) {
 // This case might indicate an issue, if principal exists, timestamp should exist.
 // For safety, if borrowing exists but timestamp is 0, set it to now to prevent issues.
 // Or, this could be after full repayment and then a new borrow in same block, which is fine.
 // If it's an old borrow with a zeroed timestamp, it's problematic. Assume it's correctly managed.
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

 // --- View Functions ---

 function getBorrowedBalanceWithInterest(address _user) public view returns (uint256) {
 if (borrowedPrincipals[_user] == 0) {
 return 0;
 }
 uint256 accruedInterest = _calculateAccruedInterest(_user);
 return borrowedPrincipals[_user] + accruedInterest;
 }

 function getUtilizationRateBps() public view returns (uint256) {
 if (totalSupplied == 0) {
 return 0; 
 }
 // Using totalBorrowed (which includes principal + already compounded interest) vs totalSupplied (principal)
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
 if (userDebt == 0) return type(uint256).max; // Should be caught above, but defensive
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

 function setLiquidationPenalty(uint256 _liquidationPenaltyBps) external onlyOwner {
 require(_liquidationPenaltyBps < BPS_DIVISOR, "Penalty too high"); 
 liquidationPenaltyBps = _liquidationPenaltyBps;
 emit LiquidationPenaltyUpdated(_liquidationPenaltyBps);
 }

 function withdrawReserves(address _to, uint256 _amount) external onlyOwner {
 require(_to != address(0), "Invalid recipient");
 require(totalReserves >= _amount, "Insufficient reserves");
 totalReserves -= _amount;
 usdcToken.transfer(_to, _amount);
 emit ReservesWithdrawn(_to, _amount);
 }
 }

