import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationMenuProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const NavigationMenu = ({ activeSection, setActiveSection }: NavigationMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile when component mounts and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
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

  // Menu items for reusability
  const menuItems = [
    { id: 'swap', label: 'Swap' },
    { id: 'earn', label: 'Earn' },
    { id: 'buy', label: 'Buy' },
    { id: 'market', label: 'Market' },
    { id: 'send', label: 'Send' },
    { id: 'card', label: 'Debit Card' },
    { id: 'help', label: 'Help' },
  ];

  return (
    <nav className="relative">
      {/* Mobile hamburger menu button */}
      {isMobile && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-black bg-white rounded-md shadow-md md:hidden"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Desktop menu */}
      {!isMobile && (
        <div className="flex space-x-10 ">
          <div className="bg-white-400 ml-12 rounded-full px-6 py-2 flex space-x-50">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`font-medium ${
                  activeSection === item.id
                    ? 'text-[#000000]'
                    : 'text-[#A0A0A0] hover:text-black'
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
        <div className="absolute top-12 z-10 w-32 mt-2 bg-white rounded-md shadow-lg">
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