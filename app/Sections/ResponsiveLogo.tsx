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
          // Mobile version - just the eagle emoji with smaller text
          <span className="text-xl font-bold tracking-tight text-[#000000]">PrediWin.com
          <Image
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Flag_of_the_United_States_%28Web_Colors%29.svg/960px-Flag_of_the_United_States_%28Web_Colors%29.svg.png"
      alt="Icon"
      width={28}
      height={16}
      className="inline w-7 h-4 ml-2 align-middle"
    />
          </span>
          
        ) : (
          <span className="text-3xl">
  <span className="text-3xl font-bold tracking-tight bg-clip-text text-[#000000]">
    PrediWin.com
    <Image
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Flag_of_the_United_States_%28Web_Colors%29.svg/960px-Flag_of_the_United_States_%28Web_Colors%29.svg.png"
      alt="Icon"
      width={28}
      height={16}
      className="inline w-7 h-4 ml-2 align-middle"
    />
  </span>
</span>

        )}
      </span>
    </div>
  );
};

export default ResponsiveLogo;