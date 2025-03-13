
import React, { useState, useEffect } from 'react';

interface WelcomePageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ activeSection, setActiveSection }) => {
  const handleEnterClick = () => {
    setActiveSection('swap');
  };
  
  const text = "Trade Foreign Currencies & Crypto—All in One!";
  const [displayText, setDisplayText] = useState("");
  const typingSpeed = 75; // Speed in milliseconds

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1)); // Ensure correct slicing
        index++;
      } else {
        clearInterval(interval);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, []); // Runs once when the component mounts


  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 3900); // 4 seconds delay

    return () => clearTimeout(timer);
  }, []);


  return (
    <div className="relative bg-[#080330] overflow-hidden mt-12">
      {/* Decorative Background Accent */}
      <div className="absolute top-0 left-0 w-full h-80 bg-[#080330] opacity-20 -z-10" />

      {/* Header */}
      <header className="flex justify-center items-center">
        
      <span className=" font-bold tracking-tight bg-clip-text text-transparent bg-[#d3c81a]">
  <span className="text-6xl">🦅</span>
</span>

        
        
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#ffffff] mb-4">
        {displayText}
        </h2>
        <p className="max-w-xl text-lg text-[#080330] mb-10">
          
        </p>
        {showButton && (
        <button
          onClick={handleEnterClick}
          className="px-8 py-3 bg-[#d3c81a] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0000aa]"
        >
          Launch App
        </button>
      )}
      </main>

      {/* Footer Accent */}
      <footer className="absolute bottom-0 w-full py-4">
        <p className="text-center text-sm text-[#080330]">
          &copy; {new Date().getFullYear()} GoldenEagle. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default WelcomePage;
