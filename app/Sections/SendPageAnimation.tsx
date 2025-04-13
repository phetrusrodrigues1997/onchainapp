import React from 'react';

// Define token images (flags/icons)
const tokenImages = {
  Nigeria: "https://flagsireland.com/cdn/shop/files/NigeriaFlag.png?v=1694521063",
  ZA: "https://cdn.britannica.com/27/4227-004-32423B42/Flag-South-Africa.jpg",
  CADC: "https://www.svgrepo.com/show/405442/flag-for-flag-canada.svg",
  BRZ: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg",
  LIRA: "https://www.svgrepo.com/show/242355/turkey.svg",
  MXP: "https://www.svgrepo.com/show/401694/flag-for-mexico.svg",
};

const SendPageAnimation = () => {
  const flagCount = Object.keys(tokenImages).length; // Total number of flags (6 in this case)

  return (
    <div className="flag-container relative w-full h-48 overflow-hidden">
      {Object.entries(tokenImages).map(([key, url], index) => {
        // Position flags in a horizontal line
        const top = 50; // Center vertically at 50% of the container height
        const spacing = 10; // 10% spacing between flags
        const left = (index * (100 / flagCount)) + (spacing / 2); // Distribute evenly with spacing

        return (
          <img
            key={key}
            src={url}
            alt={`${key} flag`}
            className="bouncing-flag absolute"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              transform: 'translateX(-50%)', // Center the flag on its left position
              animationDelay: `${Math.random() * 2}s`, // Random delay for variety
            }}
          />
        );
      })}
    </div>
  );
};

export default SendPageAnimation;