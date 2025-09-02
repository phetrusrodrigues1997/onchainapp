import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { FaDiscord } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface NavigationMenuProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onMenuToggle?: (isOpen: boolean) => void;
  onTriggerWallet?: () => void;
}

const NavigationMenu = ({ activeSection, setActiveSection, onMenuToggle, onTriggerWallet }: NavigationMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

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

  // Notify parent when menu state changes
  useEffect(() => {
    if (onMenuToggle) {
      onMenuToggle(isMenuOpen);
    }
  }, [isMenuOpen, onMenuToggle]);


  // Menu items - different for mobile and desktop
  const mobileMenuItems = [
    { id: 'home', label: 'Home' },
    { id: 'discord', label: 'How it works' },
    { id: 'createPot', label: 'Private Markets' },
    { id: 'receive', label: 'Fund Account' },
    { id: 'AI', label: 'Games' },
    { id: 'profile', label: 'Stats & Rankings' },
    { id: 'ideas', label: 'Ideas' },
  ];

  const desktopMenuItems = [
    { id: 'home', label: 'Home' },
    { id: 'discord', label: 'How it works' },
    { id: 'createPot', label: 'Private Markets' },
    { id: 'receive', label: 'Fund Account' },
    { id: 'AI', label: 'Games' },
    { id: 'profile', label: 'Stats & Rankings' },
    { id: 'bookmarks', label: 'My pots' },
    { id: 'ideas', label: 'Ideas' },
    { id: 'liveMarkets', label: 'Live Markets' },
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

      {/* Menu dropdown/overlay - different styles for mobile and desktop */}
      {isMenuOpen && (
        <>
          {isMobile ? (
            <>
              {/* Backdrop to prevent clicks on background elements */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsMenuOpen(false)}
                style={{ touchAction: 'none' }}
              />
              {/* Mobile overlay */}
              <div 
                id="mobile-menu-overlay" 
                className="fixed top-0 left-0 w-4/5 h-full bg-white z-50 flex flex-col shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header with close button */}
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Menu items - pushed higher */}
              <div className="flex flex-col justify-start px-6 -mt-16">
                {mobileMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left py-4 text-lg ${
                      activeSection === item.id
                        ? 'text-[#000070] font-medium'
                        : 'text-black hover:text-[#000070]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                
                {/* Wallet option - only show on mobile when wallet is connected */}
                {isConnected && (
                  <button
                    onClick={() => {
                      if (onTriggerWallet) {
                        onTriggerWallet();
                      }
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left py-4 text-lg text-blue-600 hover:text-blue-700 border-t border-gray-100 mt-2"
                  >
                    Wallet
                  </button>
                )}
                
                {/* Log out option - only show on mobile when wallet is connected */}
                {isConnected && (
                  <button
                    onClick={() => {
                      disconnect();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left py-4 text-lg text-red-600 hover:text-red-700 border-t border-gray-100 mt-2"
                  >
                    Log out
                  </button>
                )}
              </div>
              
              {/* Social media buttons */}
              <div className="px-4 py-6 border-t border-gray-100 mt-auto">
                <p className="text-gray-600 text-xs mb-4 text-center">
                  Still have questions? Join our community for more support.
                </p>
                <div className="flex flex-col space-y-3">
                  <a
                    href="https://discord.gg/8H9Hxc4Y"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors text-sm"
                  >
                    <FaDiscord size={16} />
                    <span>Discord Support</span>
                  </a>
                  <a
                    href="https://x.com/Prediwin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    <FaXTwitter size={16} />
                    <span>Follow on X</span>
                  </a>
                </div>
              </div>
            </div>
            </>
          ) : (
            // Desktop dropdown (unchanged)
            <div className="absolute bg-white top-12 z-50 w-48 mt-2 rounded-md shadow-lg left-0">
              <div className="py-2">
                {desktopMenuItems.map((item) => (
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
        </>
      )}
    </nav>
  );
};

export default NavigationMenu;