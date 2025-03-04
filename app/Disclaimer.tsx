import React from "react";
import { AlertCircle } from "lucide-react";

const WarningBanner: React.FC = () => {
  return (
    <div className="bg-[#FDFDFD] text-[#050505] font-bold p-4 flex items-start gap-3 rounded-md shadow-md md:flex-row md:items-center">
      <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
      <span className="text-sm md:text-base">
        <strong>UK Disclaimer:</strong> This platform enables users to trade stablecoins through Airborne Eagle Foreign Exchange at their own discretion.  
        Crypto is a high-risk investment.
      </span>
    </div>
  );
};

export default WarningBanner;
