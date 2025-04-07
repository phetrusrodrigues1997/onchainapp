import React from "react";
import { FaDiscord, FaTwitter as FaXTwitter } from "react-icons/fa";

const DiscordXSection: React.FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-[#1A3300] rounded-lg shadow-md border border-gray-600">
      <p className="text-sm sm:text-base text-white font-semibold text-center mb-4 sm:mb-6">
        Connect with us on Discord and X.
      </p>
      <div className="flex items-center justify-center space-x-6">
        <a
          href="https://discord.gg/RnsEuSNM"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
        >
          <FaDiscord className="text-2xl mr-2" />
          Join Discord
        </a>
        <a
          href="https://x.com/GoldenEagle_fi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-black text-white rounded-lg shadow-md hover:bg-gray-800 transition-all"
        >
          <FaXTwitter className="text-2xl mr-2" />
          Follow on X
        </a>
      </div>
    </div>
  );
};

export default DiscordXSection;
