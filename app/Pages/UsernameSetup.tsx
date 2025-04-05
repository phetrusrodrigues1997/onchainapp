import { useState } from 'react';
import { useAccount } from 'wagmi';
import { setUsername } from '../Database/actions';

export default function UsernameSetup() {
  const { address } = useAccount();
  const [username, setUsernameState] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError('Please connect your wallet');
      return;
    }
    if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username must be 3-20 characters, alphanumeric and underscores only');
      return;
    }
    try {
      await setUsername(address, username);
      setSuccess(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to set username');
      setSuccess(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-black rounded-xl shadow-2xl border border-gray-700">
  <h2 className="text-2xl font-extrabold text-white mb-4 tracking-wide">Choose Your Username</h2>
  <div className="space-y-4">
    <input
      type="text"
      value={username}
      onChange={(e) => setUsernameState(e.target.value)}
      placeholder="Enter a unique username"
      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out"
    />
    {error && (
      <p className="text-red-400 text-sm mt-2 flex items-center">
        <span className="mr-1">⚠️</span> {error}
      </p>
    )}
    {success && (
      <p className="text-green-400 text-sm mt-2 flex items-center">
        <span className="mr-1">✅</span> Username set successfully!
      </p>
    )}
    <button
      onClick={handleSubmit}
      className="w-full bg-[#d3c81a] text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105"
    >
      Set Username
    </button>
  </div>
</div>
  );
}