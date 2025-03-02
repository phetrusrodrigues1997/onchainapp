import React, { useEffect, useState } from 'react';

const Footer = () => {
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile when component mounts and when window resizes
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
    <footer className={`${isMobile ? 'flex-col space-y-2' : 'flex justify-between'} items-center p-4 text-sm text-gray-800 bg-white-100`}>
      <div className={`${isMobile ? 'text-center' : ''}`}>
        <span>2025 © AirborneEagle Solutions, </span>
        <span className="font-bold">v1.0.0</span>
      </div>
      <div className={`flex items-center ${isMobile ? 'justify-center' : ''}`}>
        <span>A public good for</span>
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mx-1"></div>
        <span className="font-bold">Base</span>
      </div>
    </footer>
  );
};

export default Footer;