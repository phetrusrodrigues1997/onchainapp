import React, { useEffect, useState } from 'react';

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
          <span className="text-xl font-bold tracking-tight">
            <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-[#d3c81a]">
            <span className="text-black"></span><span>🦅</span>
          </span>
            {/* <span className="text-black">🦅</span> */}
          </span>
          
        ) : (
          // Desktop version - full logo
            <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-[#d3c81a]">
            Golden<span className="text-[#f3f3f3]">Eagle</span><span>🦅</span>
          </span>
        )}
      </span>
    </div>
  );
};

export default ResponsiveLogo;