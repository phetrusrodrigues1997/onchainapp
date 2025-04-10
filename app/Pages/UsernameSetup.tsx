import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { setUsername, getUsername } from '../Database/actions';

export default function UsernameSetup() {
  const { address } = useAccount();
  const [username, setUsernameState] = useState('');
  const [existingUsername, setExistingUsername] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Function to validate username
  const isValidUsername = (username: string): boolean => {
    return username.length >= 3 && 
           username.length <= 20 && 
           /^[a-zA-F0-9_]+$/.test(username);
  };

  useEffect(() => {
    const fetchUsername = async () => {
      if (address) {
        try {
          const username = await getUsername(address);
          setExistingUsername(username);
          setIsEditing(!username); // Start in editing mode if no username
        } catch (err) {
          console.error('Error fetching username:', err);
          setError('Failed to load username');
        }
      }
    };
    fetchUsername();
  }, [address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError('Please connect your wallet');
      return;
    }
    if (!isValidUsername(username)) {
      setError('Username must be 3-20 characters, alphanumeric and underscores only');
      return;
    }
    try {
      await setUsername(address, username);
      setExistingUsername(username);
      setIsEditing(false);
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set username');
      setSuccess(false);
    }
  };

  if (!address) {
    return <p className="text-white">Please connect your wallet</p>;
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-[#101010] rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-2xl font-extrabold text-white mb-4 tracking-wide">
        {existingUsername ? 'Your Username' : 'Choose Your Username'}
      </h2>
      {isEditing || !existingUsername ? (
        <div className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsernameState(e.target.value)}
            placeholder={existingUsername ? "Enter new username" : "Enter a unique username"}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out"
          />
          {error && (
            <p className="text-red-400 text-sm mt-2 flex items-center">
              <span className="mr-1">⚠️</span> {error}
            </p>
          )}
          {success && (
            <p className="text-green-400 text-sm mt-2 flex items-center">
              <span className="mr-1">✅</span> Username {existingUsername ? 'updated' : 'set'} successfully!
            </p>
          )}
          <button
            onClick={handleSubmit}
            className="w-full bg-[#d3c81a] text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            {existingUsername ? 'Update Username' : 'Set Username'}
          </button>
          {existingUsername && (
            <button
              onClick={() => {
                setIsEditing(false);
                setUsernameState('');
                setError(null);
                setSuccess(false);
              }}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 transition-all duration-300"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
          <span className="text-white text-lg font-medium">{existingUsername}</span>
          <button
            onClick={() => {
              setIsEditing(true);
              setUsernameState(existingUsername);
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-all duration-300"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}