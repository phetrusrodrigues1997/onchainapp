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
            <span className="text-purple-700">PrediWin</span>
            <span className="text-black">.com</span>
           <Image
  src="/ghostie.png"
  alt="Icon"
  width={38}
  height={26}
  className="ml-2 flex-shrink-0"
/>
            
          </span>
          
        ) : (
          <span className="flex items-center whitespace-nowrap text-3xl font-extrabold tracking-wide">
            <span className="text-purple-700">PrediWin</span>
            <span className="text-black">.com</span>
            <Image
  src="/ghostie.png"
  alt="Icon"
  width={38}
  height={26}
  className="ml-2 flex-shrink-0"
/>
          </span>

        )}
      </span>
    </div>
  );
};

export default ResponsiveLogo;