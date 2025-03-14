import React from 'react';
import { useState, useEffect } from "react";

const images = [
  "https://images.pexels.com/photos/14751274/pexels-photo-14751274.jpeg?cs=srgb&dl=pexels-anntarazevich-14751274.jpg&fm=jpg",
  "https://plus.unsplash.com/premium_photo-1722018576685-45a415a4ff67?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3BhY2V8ZW58MHx8MHx8fDA%3D",
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
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="container mx-auto px-4 flex flex-col h-full">
          {/* Logo area */}
          <div className="mt-12 sm:mt-16 flex justify-center">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-[#d3c81a]">
              Golden<span className="text-[#f3f3f3]">Eagle</span><span>🦅</span>
            </span>
          </div>
          
          {/* Main content area */}
          <div className="flex-grow flex flex-col justify-center items-center max-w-lg mx-auto text-center mt-64">
  <h2 className="text-2xl font-extrabold text-white leading-tight">
    Trade Foreign Currencies <br /> & Crypto—All in One!
  </h2>
  <div className="mt-8 sm:mt-10 w-full flex justify-center">
    <button 
      className=" px-8 py-4 bg-[#d3c81a] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0000aa] transition-colors"
      onClick={handleEnterClick}
    >
      Launch App
    </button>
  </div>
</div>

          
          {/* Empty space at bottom for balance */}
          <div className="h-16 sm:h-24"></div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;