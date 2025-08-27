import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const ResponsiveLogo = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <div className="logo-container">
      <span className="relative inline-block font-sans">
        {isMobile ? (
          // Mobile version - prevent text and image wrapping
          <span className="flex items-center whitespace-nowrap text-2xl font-extrabold tracking-wide">
            <span className="text-red-600">PrediWin</span><span className="text-[#000000]">.com</span>
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Flag_of_the_United_States_%28Web_Colors%29.svg/960px-Flag_of_the_United_States_%28Web_Colors%29.svg.png"
              alt="Icon"
              width={28}
              height={16}
              className="w-7 h-4 ml-2 flex-shrink-0"
            />
          </span>
          
        ) : (
          <span className="flex items-center whitespace-nowrap text-3xl font-extrabold tracking-wide">
            <span className="text-red-600">PrediWin</span><span className="text-[#000000]">.com</span>
            <Image
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Flag_of_the_United_States_%28Web_Colors%29.svg/960px-Flag_of_the_United_States_%28Web_Colors%29.svg.png"
              alt="Icon"
              width={28}
              height={16}
              className="w-7 h-4 ml-2 flex-shrink-0"
            />
          </span>

        )}
      </span>
    </div>
  );
};

export default ResponsiveLogo;