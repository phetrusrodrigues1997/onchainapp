import React from 'react';
import { useState, useEffect } from "react";

const images = [
  "https://images.pexels.com/photos/40142/new-york-skyline-manhattan-hudson-40142.jpeg?cs=srgb&dl=pexels-pixabay-40142.jpg&fm=jpg",
  "https://images.pexels.com/photos/6771120/pexels-photo-6771120.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  "https://agnautacouture.com/wp-content/uploads/2012/12/jean-shrimpton-in-ny-by-david-bailey-2.jpg"
  
  

];

const FullScreenCarousel = () => {
  const [current, setCurrent] = useState(0);
  const length = images.length;

  // Auto-slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % length);
    }, 4000);
    return () => clearInterval(interval);
  }, [length]);

  return (
    <div className="fixed inset-0 w-full h-full z-0">
      <div className="relative w-full h-full overflow-hidden">
        <div 
          className="flex h-full transition-transform duration-700 ease-in-out" 
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((src, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              <img 
                src={src} 
                alt={`Slide ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
              {/* Dark overlay for better text visibility */}
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
};

interface WelcomePageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ activeSection, setActiveSection }) => {
  const handleEnterClick = () => {
    setActiveSection('swap');
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-screen Background Carousel */}
      <FullScreenCarousel />
      
      {/* Content overlay */}
      <div className="relative z-10 flex flex-col">
  <div>
    {/* Logo and Button Area */}
    <div className="absolute top-4 mr-16">
      <span className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-[#d3c81a]">
        Golden<span className="text-[#f3f3f3]">Eagle</span><span>🦅</span>
      </span>
    </div>
    <div className="absolute top-4 right-4">
      <button 
        className="px-4 py-2 bg-transparent text-white font-semibold rounded-lg shadow-lg hover:bg-[#d3c81a] transition-colors border-2 border-[#d3c81a]"
        onClick={handleEnterClick}
      >
        Launch App
      </button>
    </div>
    
    {/* Main content area */}
    <div className="flex-grow flex flex-col justify-center items-center max-w-lg mx-auto text-center mt-[100%]">
    <h2 className="text-2xl font-extrabold text-white leading-tight font-sans">
  Trade Foreign Currencies <br /> & Crypto—All in One!
</h2>
    </div>

    {/* Empty space at bottom for balance */}
    <div className="h-16 sm:h-24"></div>
  </div>
</div>
    </div>
  );
};

export default WelcomePage;