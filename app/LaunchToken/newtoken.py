# newToken.py
from web3 import Web3
from solcx import compile_source, install_solc, set_solc_version
import sys

# -------- CONFIGURATION --------
BASE_RPC_URL = "https://mainnet.base.org"  # Use https://goerli.base.org for testnet
PRIVATE_KEY = "0x73009294b5617363e6037743351caa684f8399bff50ee5b0195bb15348bf0de5"  # NEVER hardcode this in production!
CONTRACT_ADDRESS = "0x947A1657722453599f95A439f66Fbf418F72e7eD"

# Install and set solc version
install_solc('0.8.0')
set_solc_version('0.8.0')

# Connect to Base network
w3 = Web3(Web3.HTTPProvider(BASE_RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)
print(f"Using address: {account.address}")

# -------- ERC-20 CONTRACT SOURCE CODE --------
erc20_source_code = """
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AirborneEagle {
    string public name = "GoldenEagle";
    string public symbol = "GLDE";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * (10 ** uint256(decimals));
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
}
"""

# -------- COMPILE CONTRACT --------
compiled_sol = compile_source(erc20_source_code)
contract_interface = compiled_sol["<stdin>:AirborneEagle"]

# -------- CLASS FOR TOKEN MANAGEMENT --------
class GoldenEagleTokenManager:
    def __init__(self, contract_address, recipient_address):
        self.w3 = w3
        self.account = account
        self.contract_address = contract_address
        self.contract = w3.eth.contract(address=contract_address, abi=contract_interface["abi"])
        self.recipient_address = recipient_address  # Store the recipient address

    def send_tokens(self, amount=100):
        """
        Send the specified amount of GLDE tokens to the recipient address.
        Args:
            amount (int): The amount of GLDE tokens to send (default is 100).
        Returns:
            str: Transaction hash of the transfer.
        """
        if not self.recipient_address:
            raise ValueError("Recipient address must be provided during initialization")

        # Validate the recipient address
        if not Web3.is_address(self.recipient_address):
            raise ValueError(f"Invalid recipient address: {self.recipient_address}")

        to_address = Web3.to_checksum_address(self.recipient_address)  # Ensure checksum address

        # Convert the amount to wei (considering 18 decimals)
        amount_wei = amount * 10 ** 18  # 100 GLDE = 100 * 10^18 wei

        # Build the transaction
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        txn = self.contract.functions.transfer(
            to_address,
            amount_wei
        ).build_transaction({
            "from": self.account.address,
            "nonce": nonce,
            "gasPrice": self.w3.to_wei("0.5", "gwei"),
        })

        # Estimate gas with a 20% buffer
        estimated_gas = self.contract.functions.transfer(to_address, amount_wei).estimate_gas({
            "from": self.account.address
        })
        txn["gas"] = int(estimated_gas * 1.2)

        # Sign and send the transaction
        signed_txn = self.w3.eth.account.sign_transaction(txn, PRIVATE_KEY)
        txn_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        print(f"Transferring {amount} GLDE to {to_address}... Txn Hash: {txn_hash.hex()}")

        # Wait for receipt (optional, for confirmation)
        receipt = self.w3.eth.wait_for_transaction_receipt(txn_hash)
        print(f"Transaction confirmed. Receipt: {receipt.transactionHash.hex()}")
        return txn_hash.hex()

# -------- COMMAND-LINE EXECUTION --------
if __name__ == "__main__":
    # Check if a recipient address was provided as a command-line argument
    if len(sys.argv) != 2:
        print("Usage: python newToken.py <recipient_address>")
        sys.exit(1)

    # Get the recipient address from the command line
    recipient_address = sys.argv[1]

    # Instantiate the token manager with the provided recipient address
    try:
        token_manager = GoldenEagleTokenManager(CONTRACT_ADDRESS, recipient_address)
        
        # Automatically send 100 GLDE tokens to the recipient address
        txn_hash = token_manager.send_tokens(amount=100)
        print(f"Transaction Hash: {txn_hash}")
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)