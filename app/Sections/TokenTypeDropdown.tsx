// SwapDropdown.tsx
import React, { useState } from "react";

interface SwapDropdownProps {
  onSelectionChange: (option: "Stablecoins" | "Crypto") => void;
}

const SwapDropdown: React.FC<SwapDropdownProps> = ({ onSelectionChange }) => {
  const [selected, setSelected] = useState<"Stablecoins" | "Crypto">("Stablecoins");
  const [isOpen, setIsOpen] = useState(false);

  const handleSelection = (option: "Stablecoins" | "Crypto") => {
    setSelected(option);
    setIsOpen(false);
    onSelectionChange(option);
  };

  return (
    <div
      style={{ zIndex: 1000 }}
      className={`relative inline-block text-xs text-left ml-56 transform translate-y-[70px] ${selected === "Crypto" ? "translate-x-7" : ""}`}
    >
      <button
        type="button"
        className="flex items-center space-x-2 bg-black/40 text-green-300 hover:bg-[#d3c81a]/20 hover:text-[#d3c81a] px-3 py-1.5 rounded-full transition-all duration-300 text-sm border border-gray-800 "
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected} ▼
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-36 bg-gray-900 border border-gray-700 rounded-md shadow-lg">
          <ul className="py-1 text-white">
            <li
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSelection("Stablecoins")}
            >
              Stablecoins
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleSelection("Crypto")}
            >
              Crypto
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SwapDropdown;