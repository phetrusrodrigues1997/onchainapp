import React from 'react';
// Placeholder for Carousel component (you can replace with a library like react-slick)
import { useState, useEffect } from "react";

const images = [
  "https://plus.unsplash.com/premium_photo-1722018576685-45a415a4ff67?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3BhY2V8ZW58MHx8MHx8fDA%3D",
  "https://wallpapershome.com/images/pages/ico_h/27177.jpg",
  "https://agnautacouture.com/wp-content/uploads/2012/12/jean-shrimpton-in-ny-by-david-bailey-2.jpg",
  "https://w0.peakpx.com/wallpaper/149/844/HD-wallpaper-autumn-forest-forest-fall-autumn-nature-reflection-trees-lake.jpg"
  
];

const Carousel = () => {
  const [current, setCurrent] = useState(0);
  const length = images.length;

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % length);
    }, 4000);
    return () => clearInterval(interval);
  }, [length]);

  // const nextSlide = () => setCurrent((current + 1) % length);
  // const prevSlide = () => setCurrent((current - 1 + length) % length);

  return (
    <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-lg shadow-lg">
      <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
        {images.map((src, index) => (
          <img key={index} src={src} alt={`Slide ${index + 1}`} className="w-full h-96 object-contain flex-shrink-0" />        ))}
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
    <div className="full-width relative bg-[#080330] overflow-hidden mt-12">
      {/* Decorative Background Accent */}
      <div className="absolute top-0 left-0 w-full h-80 opacity-20 -z-10 bg-gradient-to-b from-[#080330] to-[#4b0082]" />

      {/* Header */}
      <header className="flex justify-center items-center py-6">
        Welcome 
      </header>

      {/* Hero Section */}
      <main className="container mx-auto">
        <div className="flex md:flex-row flex-col items-center">
          {/* Left Column: Headline and Button */}
          <div className="md:w-1/2 p-8 flex flex-col items-center md:items-start">
            <h2 className="text-4xl font-extrabold text-[#ffffff] mt-10 text-center md:text-left">
              Trade Foreign Currencies <br /> & Crypto—All in One!
            </h2>
            <div className="mt-6">
              <button className="px-8 py-3 bg-[#d3c81a] text-white font-semibold rounded-lg shadow-lg hover:bg-[#0000aa]" onClick={handleEnterClick}>
                Launch App
              </button>
            </div>
          </div>
          {/* Right Column: Carousel */}
          <div className="md:w-1/2 p-8">
            <Carousel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;