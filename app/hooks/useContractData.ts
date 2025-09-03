import { useAccount, useReadContract, useBalance } from 'wagmi';
import { CONTRACT_TO_TABLE_MAPPING } from '../Database/config';

// Prediction Pot ABI
const PREDICTION_POT_ABI = [
  {
    "inputs": [],
    "name": "getParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const useContractData = () => {
  const { address, isConnected } = useAccount();
  
  // Get contract addresses from config
  const contractAddresses = Object.keys(CONTRACT_TO_TABLE_MAPPING) as Array<keyof typeof CONTRACT_TO_TABLE_MAPPING>;

  // Individual hook calls for each contract (required due to React hooks rules)
  // We need to handle the case where there might be fewer than 3 contracts
  
  const participantsQuery1 = useReadContract({
    address: contractAddresses[0] as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address && contractAddresses.length > 0 }
  });
  
  const participantsQuery2 = useReadContract({
    address: contractAddresses[1] as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address && contractAddresses.length > 1 }
  });
  
  const participantsQuery3 = useReadContract({
    address: contractAddresses[2] as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address && contractAddresses.length > 2 }
  });

  const balanceQuery1 = useBalance({
    address: contractAddresses[0] as `0x${string}`,
    chainId: 8453,
    query: { enabled: contractAddresses.length > 0 }
  });
  
  const balanceQuery2 = useBalance({
    address: contractAddresses[1] as `0x${string}`,
    chainId: 8453,
    query: { enabled: contractAddresses.length > 1 }
  });
  
  const balanceQuery3 = useBalance({
    address: contractAddresses[2] as `0x${string}`,
    chainId: 8453,
    query: { enabled: contractAddresses.length > 2 }
  });

  // Organize data for easy consumption - only include data for contracts that exist
  const participantsData = [
    contractAddresses.length > 0 ? participantsQuery1.data : undefined,
    contractAddresses.length > 1 ? participantsQuery2.data : undefined, 
    contractAddresses.length > 2 ? participantsQuery3.data : undefined
  ].slice(0, contractAddresses.length);

  const balancesData = [
    contractAddresses.length > 0 ? balanceQuery1.data : undefined,
    contractAddresses.length > 1 ? balanceQuery2.data : undefined,
    contractAddresses.length > 2 ? balanceQuery3.data : undefined
  ].slice(0, contractAddresses.length);
  
  return {
    contractAddresses,
    participantsData,
    balancesData,
    isConnected,
    address
  };
};