import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useAccount } from 'wagmi';

interface NavigationMenuProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  
}

const NavigationMenu = ({ activeSection, setActiveSection }: NavigationMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { address, isConnected } = useAccount();

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

  // Menu items
  const menuItems = [
    { id: 'home', label: 'Home' },
    { id: 'liveMarkets', label: 'Live Markets' },
    { id: 'createPot', label: 'Private Markets' },
    { id: 'buy', label: 'Fund Account' },
    { id: 'AI', label: 'Games' },
    { id: 'profile', label: 'Stats & Rankings' },
    { id: 'discord', label: 'Help' },
  ];

  return (
    <nav className="relative">
      {/* Hamburger menu button - now shown on both desktop and mobile */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 rounded-lg"
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu dropdown - shown for both desktop and mobile when hamburger is clicked */}
      {isMenuOpen && (
        <div className="absolute bg-white top-12 z-50 w-48 mt-2 rounded-md shadow-lg left-0">
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