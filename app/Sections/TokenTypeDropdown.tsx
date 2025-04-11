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
        className="text-white font-bold px-4 py-2 rounded-md shadow-sm border border-[#bfbfbf] hover:bg-[#d3c81a] hover:border-[#d3c81a]"
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