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
          <span className="text-xl font-bold tracking-tight text-[#b5ae15]">Foresight
          </span>
          
        ) : (
          <span className="text-3xl"><span className="text-3xl font-bold tracking-tight bg-clip-text text-[#b5ae15]">Foresight
          </span>
          </span>
        )}
      </span>
    </div>
  );
};

export default ResponsiveLogo;