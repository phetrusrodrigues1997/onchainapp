// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAavePool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    struct ReserveData {
        address aTokenAddress; // Simplified struct
        // Additional fields omitted for brevity
    }

    function getReserveData(address asset) external view returns (ReserveData memory);
}