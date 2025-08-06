// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PredictionPot {
    IERC20 public usdc;
    address public owner;
    address[] public participants;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }
    
    /// @notice Pay any amount of USDC to enter the pot
    function enterPot(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        participants.push(msg.sender);
    }
    
    /// @notice Allow owner to add participants without payment (for referral rewards)
    function enterPotFree(address participant) external onlyOwner {
        participants.push(participant);
    }
    
    /// @notice Distribute entire USDC balance equally among `winners`
    function distributePot(address[] calldata winners) external onlyOwner {
        require(winners.length > 0, "No winners");
        uint256 balance = usdc.balanceOf(address(this));
        uint256 share = balance / winners.length;
        require(share > 0, "No funds to distribute");
        
        for (uint256 i = 0; i < winners.length; i++) {
            require(usdc.transfer(winners[i], share), "Transfer to winner failed");
        }
        
        delete participants;
    }
    
    /// @notice Get list of current participants
    function getParticipants() external view returns (address[] memory) {
        return participants;
    }
    
    /// @notice Get current pot balance
    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}