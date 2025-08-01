import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationMenuProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const NavigationMenu = ({ activeSection, setActiveSection }: NavigationMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 787px)').matches);
    };
  
    // Initial check
    checkIfMobile();
  
    // Listen for window resize events
    window.addEventListener('resize', checkIfMobile);
  
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Menu items for reusability
  const menuItems = [
    { id: 'home', label: 'Home' },
    { id: 'markets', label: 'Markets' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'buy', label: 'Purchase' },
    { id: 'discord', label: 'Discord' },
    { id: 'market', label: 'Charts' },
    { id: 'discord', label: 'Discord' },
  ];

  return (
    <nav className="relative">
      {/* Mobile hamburger menu button */}
      {isMobile && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-black bg-white rounded-md md:hidden border border-gray-200  "
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Desktop menu */}
      {!isMobile && (
        <div className="flex space-x-10 ">
        <div className="bg-white-400 ml-32 rounded-full py-2 flex space-x-10">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`font-medium ${
                activeSection === item.id
                  ? 'text-black text-base font-semibold'
                  : 'text-[#666666] hover:text-black hover:font-semibold'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Mobile menu dropdown */}
      {isMobile && isMenuOpen && (
        <div className="absolute bg-white top-12 z-50 w-32 mt-2 rounded-md shadow-lg">
        <div className="py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setIsMenuOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 ${
                activeSection === item.id
                  ? 'bg-gray-100 text-[#000070]'
                  : 'text-black hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      )}
    </nav>
  );
};

export default NavigationMenu;