// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PredictionPotWithCloning {
    using Clones for address;

    IERC20 public usdc;
    address public owner;
    address public creator;
    string public potName;
    string public description;
    address[] public participants;
    bool private initialized;
    
    enum PotState { Active, Closed, Distributed }
    PotState public state;

    event CloneCreated(address indexed clone, address indexed owner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /// @notice Implementation constructor. Mark the implementation as initialized so
    /// it cannot be used as a live pot. The `_usdc` set here applies only to the
    /// implementation and does not affect clones (clones must be initialized).
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
        owner = msg.sender;
        initialized = true; // protect implementation from being initialized/used
    }

    /// @notice Initialize function for clones. MUST be called exactly once on each clone.
    /// @param _owner Owner of the clone (typically msg.sender in the factory call)
    /// @param _usdc  Address of the USDC token to be used by the clone
    /// @param _potName Name/title of the prediction pot
    /// @param _description Description of what users are predicting
    function initialize(address _owner, address _usdc, string memory _potName, string memory _description) external {
        require(!initialized, "Already initialized");
        initialized = true;
        owner = _owner;
        creator = _owner;
        usdc = IERC20(_usdc);
        potName = _potName;
        description = _description;
        state = PotState.Active;
    }

    /// @notice Create a cheap clone (EIP-1167) and initialize it for the caller.
    /// @param _usdc Address of USDC token for the new clone.
    /// @param _potName Name/title of the prediction pot
    /// @param _description Description of what users are predicting
    /// @return address of the newly created clone.
    function createClone(address _usdc, string memory _potName, string memory _description) external returns (address) {
        address clone = Clones.clone(address(this));
        // initialize the clone so it sets its own owner and token address
        PredictionPotWithCloning(clone).initialize(msg.sender, _usdc, _potName, _description);
        emit CloneCreated(clone, msg.sender);
        return clone;
    }

    /// @notice Pay any amount of USDC to enter the pot
    function enterPot(uint256 amount) external {
        require(state == PotState.Active, "Pot is not accepting entries");
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        participants.push(msg.sender);
    }

    /// @notice Allow owner to add participants without payment (for referral rewards)
    function enterPotFree(address participant) external onlyOwner {
        require(state == PotState.Active, "Pot is not accepting entries");
        participants.push(participant);
    }

    /// @notice Close pot to new entries (owner only)
    function closePot() external onlyOwner {
        require(state == PotState.Active, "Pot is not active");
        state = PotState.Closed;
    }

    /// @notice Distribute entire USDC balance equally among `winners`
    function distributePot(address[] calldata winners) external onlyOwner {
        require(state == PotState.Closed, "Must close pot first");
        require(winners.length > 0, "No winners");
        uint256 balance = usdc.balanceOf(address(this));
        uint256 share = balance / winners.length;
        require(share > 0, "No funds to distribute");

        for (uint256 i = 0; i < winners.length; i++) {
            require(usdc.transfer(winners[i], share), "Transfer to winner failed");
        }

        delete participants;
        state = PotState.Distributed;
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
