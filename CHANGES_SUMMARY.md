# PredictionPotTest.tsx ETH Migration Summary

## Key Changes Made:

1. **Contract Addresses Updated:**
   - Featured: `0x4Ff2bBB26CC30EaD90251dd224b641989Fa24e22`
   - Crypto: `0x9FBD4dA12183a374a65A94Eb66F8165c9A7be198`

2. **Contract ABI Updated:**
   - `enterPot()` is now payable (no args, uses value)
   - Constructor takes no args

3. **Pricing Updated to ETH:**
   - Sunday: 0.01 ETH (10000000000000000 wei)
   - Monday: 0.02 ETH (20000000000000000 wei)
   - etc.

4. **Key Function Changes:**
   - `writeContract()` calls now use `value: entryAmount` instead of `args: [entryAmount]`
   - `hasEnoughAllowance = true` (no approval needed for ETH)
   - `formatBigIntValue()` now defaults to 18 decimals (ETH)

## Remaining Changes Needed:

1. Update all USDC text references to ETH in the UI
2. Remove USDC approval logic completely 
3. Update balance checking to use ETH balance instead of USDC
4. Test the implementation

## The contracts are now ETH-based and should work with the new SimplePredictionPot deployments!