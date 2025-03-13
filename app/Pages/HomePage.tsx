
import React, { useState, useEffect } from 'react';

interface WelcomePageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ activeSection, setActiveSection }) => {
  const handleEnterClick = () => {
    setActiveSection('swap');
  };
  
  

  


 


  return (
    <div className="relative bg-[#080330] overflow-hidden mt-12">
      {/* Decorative Background Accent */}
      <div className="absolute top-0 left-0 w-full h-80 bg-[#080330] opacity-20 -z-10" />

      {/* Header */}
      <header className="flex justify-center items-center">
        
      <span className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-[#d3c81a]">
            Golden<span className="text-[#f3f3f3]">Eagle</span><span>🦅</span>
          </span>

        
        
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <h2 className="text-2xl md:text-2xl font-extrabold text-[#ffffff] mb-4">
        Trade Foreign Currencies & Crypto—All in One!
        </h2>
        <p className="max-w-xl text-lg text-[#080330] mb-10">
          
        </p>
        
        <button
          onClick={handleEnterClick}
          className="px-8 py-3 bg-[#d3c81a] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0000aa]"
        >
          Launch App
        </button>
    
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
